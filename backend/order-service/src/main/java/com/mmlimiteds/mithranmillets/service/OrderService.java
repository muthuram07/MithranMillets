package com.mmlimiteds.mithranmillets.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;
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

/**
 * OrderService — full implementation including helper methods requested by caller:
 *  - getOrderHistoryWithItems
 *  - getAllOrdersWithItems
 *  - getAddressForCurrentUser
 *  - getAddressByUsername
 *  - fetchCurrentCartTotals
 *  - saveAddress
 *
 * Uses UserFeignClient to fetch user details from auth-service (port 8085).
 * EmailService is used to send order status notifications asynchronously.
 */
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private AddressRepository addressRepo;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private CartClient cartClient;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PaymentClient paymentClient;

    @Autowired
    private ProductClient productClient;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private UserFeignClient userFeignClient;

    @Autowired
    private EmailService emailService;

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

        // Calculate subtotal
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

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalStateException("Cart total is zero; cannot place order");

        // New: tax (5% of subtotal) and delivery charge (₹40 if subtotal < 500)
        final BigDecimal TAX_RATE = BigDecimal.valueOf(0.05); // 5%
        final BigDecimal DELIVERY_THRESHOLD = BigDecimal.valueOf(500);
        final BigDecimal DELIVERY_CHARGE = BigDecimal.valueOf(40);

        BigDecimal tax = subtotal.multiply(TAX_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal deliveryCharge = subtotal.compareTo(DELIVERY_THRESHOLD) < 0 ? DELIVERY_CHARGE : BigDecimal.ZERO;

        // Total amount = subtotal + tax + deliveryCharge
        BigDecimal totalAmount = subtotal.add(tax).add(deliveryCharge).setScale(2, RoundingMode.HALF_UP);

        // Build and persist order
        Order order = new Order();
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalQuantity(totalQty);
        order.setTotalAmount(totalAmount);
        order.setPaymentMethod(dto.getPaymentMethod());
        order.setStatus("PLACED");
        order.setOrderDate(new Date());
        order.setAddress(address);
        order.setUsername(username);

        // If your Order entity has dedicated fields for tax/delivery, set them here:
        // order.setTax(tax);
        // order.setDeliveryCharge(deliveryCharge);

        Order saved = orderRepo.save(order);

        List<OrderItem> orderItems = cartItems.stream()
                .map(ci -> {
                    OrderItem item = new OrderItem();
                    item.setOrder(saved);
                    item.setProductId(ci.getProductId());
                    item.setName(ci.getProductName());
                    item.setQuantity(ci.getQuantity());
                    item.setUnitPrice(ci.getPrice());
                    item.setImageUrl(ci.getImageUrl());
                    return item;
                })
                .collect(Collectors.toList());

        orderItemRepo.saveAll(orderItems);

        // Initiate payment with the computed totalAmount (includes tax + delivery)
        PaymentRequestDTO paymentRequest = new PaymentRequestDTO(totalAmount.doubleValue(), "INR", "order_rcpt_" + saved.getId());
        PaymentResponseDTO paymentResponse = paymentClient.initiatePayment(paymentRequest);

        saved.setRazorpayOrderId(paymentResponse.getOrderId());
        saved.setPaymentStatus("PENDING");
        orderRepo.save(saved);

        // Update stocks and clear cart
        List<ProductStockUpdateDTO> stockUpdates = cartItems.stream()
                .map(item -> new ProductStockUpdateDTO(item.getProductId(), item.getQuantity()))
                .collect(Collectors.toList());
        productClient.updateStock(stockUpdates);

        cartClient.clearCart(token);

        // Build response DTO
        OrderDTO response = modelMapper.map(saved, OrderDTO.class);
        List<OrderItemDTO> itemDTOs = orderItems.stream()
                .map(item -> modelMapper.map(item, OrderItemDTO.class))
                .collect(Collectors.toList());
        response.setItems(itemDTOs);

        // Optionally include computed charges in the DTO if it has fields for them:
        // response.setTax(tax);
        // response.setDeliveryCharge(deliveryCharge);

        // Send PLACED email asynchronously
        try {
            UserDto user = fetchUser(username);
            String to = user != null ? user.getEmail() : "";
            String name = (user != null && StringUtils.hasText(user.getFullName())) ? user.getFullName() : username;
            String extraHtml = buildOrderSummaryHtml(orderItems);
            // You may want to include subtotal, tax, delivery, total in the email summary
            if (StringUtils.hasText(to)) {
                emailService.sendOrderStatusEmail(to, "PLACED", saved.getId().toString(), name, extraHtml);
            }
        } catch (Exception ex) {
            System.err.println("Failed to trigger PLACED email: " + ex.getMessage());
        }

        return response;
    }


    public Order markOrderAsPaid(String razorpayOrderId) {
        Order order = orderRepo.findByRazorpayOrderId(razorpayOrderId)
            .orElseThrow(() -> new OrderNotFoundException("No order found with Razorpay ID: " + razorpayOrderId));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new IllegalStateException("Order is already marked as PAID");
        }

        order.setPaymentStatus("PAID");
        order.setStatus("CONFIRMED");
        Order saved = orderRepo.save(order);

        // send CONFIRMED email
        try {
            UserDto user = fetchUser(saved.getUsername());
            String to = user != null ? user.getEmail() : "";
            String name = (user != null && StringUtils.hasText(user.getFullName())) ? user.getFullName() : saved.getUsername();
            if (StringUtils.hasText(to)) {
                emailService.sendOrderStatusEmail(to, "CONFIRMED", saved.getId().toString(), name, "<p>Payment received successfully. Thank you!</p>");
            }
        } catch (Exception ex) {
            System.err.println("Failed to trigger CONFIRMED email: " + ex.getMessage());
        }

        return saved;
    }

    @Transactional
    public OrderDTO updateShipmentStatus(Long orderId, String newStatus, String changedBy) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        String[] steps = {"PLACED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"};
        String current = (order.getStatus() == null || order.getStatus().isBlank()) ? "PLACED" : order.getStatus().toUpperCase();
        String target = newStatus == null ? null : newStatus.toUpperCase();

        int currentIdx = Arrays.asList(steps).indexOf(current);
        int targetIdx = Arrays.asList(steps).indexOf(target);

        if (targetIdx == -1) throw new IllegalArgumentException("Invalid status: " + newStatus);
        if (currentIdx > targetIdx) throw new IllegalStateException("Cannot move status backwards");
        if (currentIdx + 1 != targetIdx && !current.equalsIgnoreCase(target)) {
            throw new IllegalStateException("Must progress step-by-step. Next allowed: " + steps[currentIdx + 1]);
        }

        order.setStatus(target);
        Order saved = orderRepo.save(order);

        OrderStatusHistory hist = new OrderStatusHistory();
        hist.setOrder(saved);
        hist.setStatus(target);
        hist.setChangedAt(new Date());
        hist.setChangedBy(changedBy);
        orderStatusHistoryRepository.save(hist);

        OrderDTO dto = modelMapper.map(saved, OrderDTO.class);
        List<OrderItemDTO> items = saved.getOrderItems().stream()
            .map(item -> modelMapper.map(item, OrderItemDTO.class))
            .collect(Collectors.toList());
        dto.setItems(items);

        // send shipment status email
        try {
            UserDto user = fetchUser(saved.getUsername());
            String to = user != null ? user.getEmail() : "";
            String name = (user != null && StringUtils.hasText(user.getFullName())) ? user.getFullName() : saved.getUsername();
            String extraHtml = null;
            if ("SHIPPED".equalsIgnoreCase(target)) {
                extraHtml = "<p>Your order has been shipped. We'll share tracking details soon.</p>";
            } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(target)) {
                extraHtml = "<p>Your delivery is on its way — please be ready to receive the package.</p>";
            } else if ("DELIVERED".equalsIgnoreCase(target)) {
                extraHtml = "<p>Order delivered. We'd love your feedback!</p>";
            }
            if (StringUtils.hasText(to)) {
                emailService.sendOrderStatusEmail(to, target, saved.getId().toString(), name, extraHtml);
            }
        } catch (Exception ex) {
            System.err.println("Failed to trigger status email: " + ex.getMessage());
        }

        return dto;
    }

    // -------------------------
    // Methods requested by caller
    // -------------------------

    public List<OrderDTO> getOrderHistoryWithItems() {
        String username = getCurrentUsername();
        List<Order> orders = orderRepo.findByUsername(username);
        return orders.stream()
            .map(order -> {
                OrderDTO dto = modelMapper.map(order, OrderDTO.class);
                List<OrderItemDTO> items = order.getOrderItems().stream()
                    .map(item -> modelMapper.map(item, OrderItemDTO.class))
                    .collect(Collectors.toList());
                dto.setItems(items);
                return dto;
            })
            .collect(Collectors.toList());
    }

    public List<OrderDTO> getAllOrdersWithItems() {
        List<Order> orders = orderRepo.findAll();
        return orders.stream()
            .map(order -> {
                OrderDTO dto = modelMapper.map(order, OrderDTO.class);
                List<OrderItemDTO> items = order.getOrderItems().stream()
                    .map(item -> modelMapper.map(item, OrderItemDTO.class))
                    .collect(Collectors.toList());
                dto.setItems(items);
                return dto;
            })
            .collect(Collectors.toList());
    }

    public Address getAddressForCurrentUser() {
        String username = getCurrentUsername();
        return addressRepo.findByUsername(username)
            .orElseThrow(() -> new AddressNotFoundException("Address not found for user: " + username));
    }

    public Address getAddressByUsername(String username) {
        return addressRepo.findByUsername(username)
            .orElseThrow(() -> new AddressNotFoundException("Address not found for user: " + username));
    }

    /**
     * Persist a new address for the current user.
     * Accepts AddressDTO, maps to Address entity, sets username and saves.
     */
    public Address saveAddress(AddressDTO dto) {
        Address address = modelMapper.map(dto, Address.class);
        address.setUsername(getCurrentUsername());
        return addressRepo.save(address);
    }

    @Transactional(readOnly = true)
    public SummaryTotalsDTO fetchCurrentCartTotals() {
        String username = getCurrentUsername();
        String token = "Bearer " + jwtUtil.generateToken(username, "USER");

        List<CartItemDTO> cartItems = cartClient.getCartItems(token);
        if (cartItems == null || cartItems.isEmpty()) {
            return new SummaryTotalsDTO(0, BigDecimal.ZERO);
        }

        int totalQty = cartItems.stream()
            .mapToInt(ci -> (ci.getQuantity() == null ? 0 : ci.getQuantity()))
            .sum();

        BigDecimal subtotal = cartItems.stream()
            .map(ci -> {
                BigDecimal price = ci.getPrice() == null ? BigDecimal.ZERO : BigDecimal.valueOf(ci.getPrice());
                int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
                return price.multiply(BigDecimal.valueOf(qty));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SummaryTotalsDTO(totalQty, subtotal);
    }

    // -------------------------
    // helper methods
    // -------------------------

    private UserDto fetchUser(String username) {
        if (!StringUtils.hasText(username)) return null;
        try {
            ResponseEntity<UserDto> resp = userFeignClient.getUserByUsername(username);
            if (resp != null && resp.getStatusCode().is2xxSuccessful()) {
                return resp.getBody();
            }
        } catch (Exception ex) {
            System.err.println("Auth service lookup failed for user " + username + ": " + ex.getMessage());
        }
        return null;
    }
    
    
    public Address updateAddress(Long id, AddressDTO dto) {
        Address address = addressRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + id));

        // Update only non-null fields (partial update logic)
        if (dto.getName() != null) address.setName(dto.getName());
        if (dto.getPhone() != null) address.setPhone(dto.getPhone());
        if (dto.getStreet() != null) address.setStreet(dto.getStreet());
        if (dto.getCity() != null) address.setCity(dto.getCity());
        if (dto.getState() != null) address.setState(dto.getState());
        if (dto.getPincode() != null) address.setPincode(dto.getPincode());

        return addressRepo.save(address);
    }

    private String buildOrderSummaryHtml(List<OrderItem> items) {
        if (items == null || items.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("<table style='width:100%;border-collapse:collapse;font-size:13px;'>");
        sb.append("<thead><tr><th style='text-align:left;padding:6px 8px;color:#555;'>Item</th><th style='text-align:right;padding:6px 8px;color:#555;'>Qty</th><th style='text-align:right;padding:6px 8px;color:#555;'>Price</th></tr></thead>");
        sb.append("<tbody>");
        for (OrderItem it : items) {
            sb.append("<tr>");
            sb.append("<td style='padding:6px 8px;border-top:1px solid #eee;'>").append(escapeHtml(it.getName())).append("</td>");
            sb.append("<td style='padding:6px 8px;border-top:1px solid #eee;text-align:right;'>").append(it.getQuantity()).append("</td>");
            sb.append("<td style='padding:6px 8px;border-top:1px solid #eee;text-align:right;'>₹").append(it.getUnitPrice()).append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");
        return sb.toString();
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Order not found with id " + orderId));
        return modelMapper.map(order, OrderDTO.class);
    }

}
