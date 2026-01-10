package com.mmlimiteds.mithranmillets.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.mmlimiteds.mithranmillets.client.CartClient;
import com.mmlimiteds.mithranmillets.client.PaymentClient;
import com.mmlimiteds.mithranmillets.client.ProductClient;
import com.mmlimiteds.mithranmillets.client.UserFeignClient;
import com.mmlimiteds.mithranmillets.dto.AddressDTO;
import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.OrderDTO;
import com.mmlimiteds.mithranmillets.dto.OrderItemDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;
import com.mmlimiteds.mithranmillets.dto.SummaryTotalsDTO;
import com.mmlimiteds.mithranmillets.dto.UserDto;
import com.mmlimiteds.mithranmillets.entity.Address;
import com.mmlimiteds.mithranmillets.entity.Order;
import com.mmlimiteds.mithranmillets.entity.OrderItem;
import com.mmlimiteds.mithranmillets.entity.OrderStatusHistory;
import com.mmlimiteds.mithranmillets.exception.AddressNotFoundException;
import com.mmlimiteds.mithranmillets.exception.CartEmptyException;
import com.mmlimiteds.mithranmillets.exception.OrderNotFoundException;
import com.mmlimiteds.mithranmillets.repository.AddressRepository;
import com.mmlimiteds.mithranmillets.repository.OrderItemRepository;
import com.mmlimiteds.mithranmillets.repository.OrderRepository;
import com.mmlimiteds.mithranmillets.repository.OrderStatusHistoryRepository;
import com.mmlimiteds.mithranmillets.security.JwtUtil;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepo;
    @Autowired private AddressRepository addressRepo;
    @Autowired private ModelMapper modelMapper;
    @Autowired private CartClient cartClient;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PaymentClient paymentClient;
    @Autowired private ProductClient productClient;
    @Autowired private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Autowired private OrderItemRepository orderItemRepo;
    @Autowired private UserFeignClient userFeignClient;
    @Autowired private EmailService emailService;

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @Transactional
    public OrderDTO placeOrder(OrderDTO dto) {
        String username = getCurrentUsername();
        String token = "Bearer " + jwtUtil.generateToken(username, "USER");

        List<CartItemDTO> cartItems = cartClient.getCartItems(token);
        if (cartItems == null || cartItems.isEmpty()) throw new CartEmptyException(username);

        if (dto.getAddress() == null || dto.getAddress().getId() == null)
            throw new IllegalArgumentException("Address ID must not be null");

        Address address = addressRepo.findById(dto.getAddress().getId())
                .orElseThrow(() -> new AddressNotFoundException(dto.getAddress().getId()));

        // Totals Calculation
        BigDecimal subtotal = cartItems.stream()
                .map(ci -> {
                    BigDecimal price = ci.getPrice() == null ? BigDecimal.ZERO : BigDecimal.valueOf(ci.getPrice());
                    int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
                    return price.multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQty = cartItems.stream()
                .mapToInt(ci -> ci.getQuantity() == null ? 0 : ci.getQuantity())
                .sum();

        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(500)) < 0 ? BigDecimal.valueOf(40) : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(tax).add(deliveryCharge).setScale(2, RoundingMode.HALF_UP);

        // 1. Create and Save Order Entity
        Order order = new Order();
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalQuantity(totalQty);
        order.setTotalAmount(totalAmount);
        order.setPaymentMethod(dto.getPaymentMethod());
        order.setStatus("PLACED");
        order.setOrderDate(new Date());
        order.setAddress(address);
        order.setUsername(username);
        Order savedOrder = orderRepo.save(order);

        // 2. Create and Save OrderItems
        List<OrderItem> orderItems = cartItems.stream().map(ci -> {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setProductId(ci.getProductId());
            item.setName(ci.getProductName());
            item.setQuantity(ci.getQuantity());
            item.setUnitPrice(ci.getPrice());
            item.setImageUrl(ci.getImageUrl());
            return item;
        }).collect(Collectors.toList());
        orderItemRepo.saveAll(orderItems);

        // 3. Payment Integration
        PaymentRequestDTO paymentRequest = new PaymentRequestDTO();
        paymentRequest.setAmount(totalAmount.doubleValue());
        paymentRequest.setCurrency("INR");
        paymentRequest.setReceipt("order_rcpt_" + savedOrder.getId());
        PaymentResponseDTO paymentResponse = paymentClient.initiatePayment(paymentRequest);

        savedOrder.setRazorpayOrderId(paymentResponse.getOrderId());
        savedOrder.setPaymentStatus("PENDING");
        orderRepo.save(savedOrder);

        // 4. Stock Update
        List<ProductStockUpdateDTO> stockUpdates = cartItems.stream().map(item -> {
            ProductStockUpdateDTO u = new ProductStockUpdateDTO();
            u.setProductId(item.getProductId());
            u.setQuantity(item.getQuantity());
            return u;
        }).collect(Collectors.toList());
        productClient.updateStock(stockUpdates);

        cartClient.clearCart(token);

        // 5. Build clean Response DTO (This fixes the 500 Serialization error)
        OrderDTO responseDto = modelMapper.map(savedOrder, OrderDTO.class);
        List<OrderItemDTO> itemDtos = orderItems.stream()
                .map(item -> modelMapper.map(item, OrderItemDTO.class))
                .collect(Collectors.toList());
        responseDto.setItems(itemDtos);

        // 6. Async Email (Wrapped in try-catch to ensure it never breaks the response)
        try {
            UserDto user = fetchUser(username);
            if (user != null && StringUtils.hasText(user.getEmail())) {
                emailService.sendOrderStatusEmail(
                    user.getEmail(), 
                    "PLACED", 
                    savedOrder.getId().toString(), 
                    StringUtils.hasText(user.getFullName()) ? user.getFullName() : username, 
                    buildOrderSummaryHtml(orderItems)
                );
            }
        } catch (Exception e) {
            // Log but ignore so customer still sees order confirmation
        }

        return responseDto;
    }

    @Transactional(readOnly = true)
    public SummaryTotalsDTO fetchCurrentCartTotals() {
        String username = getCurrentUsername();
        String token = "Bearer " + jwtUtil.generateToken(username, "USER");
        List<CartItemDTO> cartItems = cartClient.getCartItems(token);
        
        SummaryTotalsDTO summary = new SummaryTotalsDTO();
        if (cartItems == null || cartItems.isEmpty()) {
            summary.setTotalQuantity(0);
            summary.setSubtotal(BigDecimal.ZERO);
            return summary;
        }

        int totalQty = cartItems.stream().mapToInt(ci -> ci.getQuantity() == null ? 0 : ci.getQuantity()).sum();
        BigDecimal subtotal = cartItems.stream()
                .map(ci -> BigDecimal.valueOf(ci.getPrice() == null ? 0 : ci.getPrice())
                .multiply(BigDecimal.valueOf(ci.getQuantity() == null ? 0 : ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.setTotalQuantity(totalQty);
        summary.setSubtotal(subtotal);
        return summary;
    }

    public Order markOrderAsPaid(String razorpayOrderId) {
        Order order = orderRepo.findByRazorpayOrderId(razorpayOrderId)
            .orElseThrow(() -> new OrderNotFoundException("ID: " + razorpayOrderId));
        order.setPaymentStatus("PAID");
        order.setStatus("CONFIRMED");
        return orderRepo.save(order);
    }

    @Transactional
    public OrderDTO updateShipmentStatus(Long orderId, String newStatus, String changedBy) {
        Order order = orderRepo.findById(orderId).orElseThrow(() -> new OrderNotFoundException("ID: " + orderId));
        order.setStatus(newStatus.toUpperCase());
        Order saved = orderRepo.save(order);

        OrderStatusHistory hist = new OrderStatusHistory();
        hist.setOrder(saved);
        hist.setStatus(newStatus.toUpperCase());
        hist.setChangedAt(new Date());
        hist.setChangedBy(changedBy);
        orderStatusHistoryRepository.save(hist);

        OrderDTO dto = modelMapper.map(saved, OrderDTO.class);
        dto.setItems(saved.getOrderItems().stream().map(i -> modelMapper.map(i, OrderItemDTO.class)).collect(Collectors.toList()));
        return dto;
    }

    public List<OrderDTO> getOrderHistoryWithItems() {
        return orderRepo.findByUsername(getCurrentUsername()).stream()
            .map(o -> {
                OrderDTO d = modelMapper.map(o, OrderDTO.class);
                d.setItems(o.getOrderItems().stream().map(i -> modelMapper.map(i, OrderItemDTO.class)).collect(Collectors.toList()));
                return d;
            }).collect(Collectors.toList());
    }

    public List<OrderDTO> getAllOrdersWithItems() {
        return orderRepo.findAll().stream()
            .map(o -> {
                OrderDTO d = modelMapper.map(o, OrderDTO.class);
                d.setItems(o.getOrderItems().stream().map(i -> modelMapper.map(i, OrderItemDTO.class)).collect(Collectors.toList()));
                return d;
            }).collect(Collectors.toList());
    }

    public Address getAddressForCurrentUser() { return getAddressByUsername(getCurrentUsername()); }

    public Address getAddressByUsername(String username) {
        return addressRepo.findByUsername(username).orElseThrow(() -> new AddressNotFoundException("User: " + username));
    }

    public Address saveAddress(AddressDTO dto) {
        Address address = modelMapper.map(dto, Address.class);
        address.setUsername(getCurrentUsername());
        return addressRepo.save(address);
    }

    public Address updateAddress(Long id, AddressDTO dto) {
        Address address = addressRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (dto.getName() != null) address.setName(dto.getName());
        if (dto.getPhone() != null) address.setPhone(dto.getPhone());
        if (dto.getStreet() != null) address.setStreet(dto.getStreet());
        if (dto.getCity() != null) address.setCity(dto.getCity());
        if (dto.getState() != null) address.setState(dto.getState());
        if (dto.getPincode() != null) address.setPincode(dto.getPincode());
        return addressRepo.save(address);
    }

    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepo.findById(orderId).orElseThrow(() -> new OrderNotFoundException("ID: " + orderId));
        OrderDTO dto = modelMapper.map(order, OrderDTO.class);
        dto.setItems(order.getOrderItems().stream().map(i -> modelMapper.map(i, OrderItemDTO.class)).collect(Collectors.toList()));
        return dto;
    }

    private UserDto fetchUser(String username) {
        try {
            ResponseEntity<UserDto> resp = userFeignClient.getUserByUsername(username);
            return (resp != null && resp.getStatusCode().is2xxSuccessful()) ? resp.getBody() : null;
        } catch (Exception e) { return null; }
    }

    private String buildOrderSummaryHtml(List<OrderItem> items) {
        StringBuilder sb = new StringBuilder("<table border='1' style='border-collapse:collapse;width:100%;'><tr><th>Item</th><th>Qty</th><th>Price</th></tr>");
        for (OrderItem it : items) {
            sb.append("<tr><td>").append(it.getName()).append("</td><td align='center'>")
              .append(it.getQuantity()).append("</td><td>₹")
              .append(it.getUnitPrice()).append("</td></tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }
    public void deleteOrderById(Long orderId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found with id: " + orderId)
                );

        // 🚫 SAFETY RULE: DO NOT DELETE DELIVERED ORDERS
        if ("DELIVERED".equals(order.getStatus())) {
            throw new IllegalStateException("Delivered orders cannot be deleted");
        }

        orderRepo.delete(order);
    }
}