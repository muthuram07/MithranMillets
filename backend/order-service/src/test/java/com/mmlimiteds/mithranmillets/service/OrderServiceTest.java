package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.client.CartClient;
import com.mmlimiteds.mithranmillets.client.PaymentClient;
import com.mmlimiteds.mithranmillets.client.ProductClient;
import com.mmlimiteds.mithranmillets.client.UserFeignClient;
import com.mmlimiteds.mithranmillets.dto.*;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * TC-ORDER Test Suite - Service Layer Tests
 * Tests business logic correctness as specified in TEST_CASES.md
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private CartClient cartClient;

    @Mock
    private PaymentClient paymentClient;

    @Mock
    private ProductClient productClient;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private UserFeignClient userFeignClient;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OrderService orderService;

    private Order testOrder;
    private OrderDTO testOrderDTO;
    private Address testAddress;
    private CartItemDTO testCartItem;

//    @BeforeEach
//    void setUp() {
//        // Setup security context
//        SecurityContextHolder.setContext(securityContext);
//        when(securityContext.getAuthentication()).thenReturn(authentication);
//        when(authentication.getName()).thenReturn("testuser");
//        when(jwtUtil.generateToken("testuser", "USER")).thenReturn("test-token");
//
//        testAddress = new Address();
//        testAddress.setId(1L);
//        testAddress.setStreet("123 Main St");
//        testAddress.setCity("Mumbai");
//        testAddress.setState("Maharashtra");
//        testAddress.setZipCode("400001");
//        testAddress.setUsername("testuser");
//
//        testCartItem = new CartItemDTO();
//        testCartItem.setProductId(1L);
//        testCartItem.setProductName("Test Millet");
//        testCartItem.setQuantity(2);
//        testCartItem.setPrice(100.00);
//
//        testOrder = new Order();
//        testOrder.setId(1L);
//        testOrder.setUsername("testuser");
//        testOrder.setTotalAmount(BigDecimal.valueOf(500.00));
//        testOrder.setStatus("PLACED");
//        testOrder.setAddress(testAddress);
//
//        testOrderDTO = new OrderDTO();
//        testOrderDTO.setId(1L);
//        testOrderDTO.setUsername("testuser");
//        testOrderDTO.setTotalAmount(500.00);
//        testOrderDTO.setStatus("PLACED");
//    }

    @Test
    @DisplayName("TC-ORDER-012: Order Total Calculation")
    void testOrderTotalCalculation() {
        // Setup
        AddressDTO addressDTO = new AddressDTO();
        addressDTO.setId(1L);

        OrderDTO orderDTO = new OrderDTO();
        orderDTO.setAddress(addressDTO);
        orderDTO.setPaymentMethod("RAZORPAY");

        List<CartItemDTO> cartItems = Arrays.asList(testCartItem);
        CartItemDTO item2 = new CartItemDTO();
        item2.setProductId(2L);
        item2.setProductName("Another Millet");
        item2.setQuantity(1);
        item2.setPrice(150.00);
        cartItems.add(item2);

        PaymentResponseDTO paymentResponse = new PaymentResponseDTO();
        paymentResponse.setOrderId("razorpay_order_123");
        paymentResponse.setStatus("created");

        when(cartClient.getCartItems(anyString())).thenReturn(cartItems);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(orderItemRepository.saveAll(anyList())).thenReturn(Arrays.asList(new OrderItem()));
        when(paymentClient.initiatePayment(any(PaymentRequestDTO.class))).thenReturn(paymentResponse);
        when(modelMapper.map(any(Order.class), eq(OrderDTO.class))).thenReturn(testOrderDTO);

        // Execute
        OrderDTO result = orderService.placeOrder(orderDTO);

        // Verify - Total should be: (2*100 + 1*150) = 350 + tax (5%) + delivery
        // Subtotal = 350, Tax = 17.5, Delivery = 40 (if subtotal < 500)
        // Total = 350 + 17.5 + 40 = 407.5
        verify(orderRepository).save(argThat(order -> {
            BigDecimal expectedTotal = BigDecimal.valueOf(350)
                    .add(BigDecimal.valueOf(17.5))
                    .add(BigDecimal.valueOf(40));
            return order.getTotalAmount().compareTo(expectedTotal) == 0;
        }));
    }

    @Test
    @DisplayName("TC-ORDER-002: Place Order - Empty Cart")
    void testPlaceOrder_EmptyCart() {
        // Setup
        OrderDTO orderDTO = new OrderDTO();
        AddressDTO addressDTO = new AddressDTO();
        addressDTO.setId(1L);
        orderDTO.setAddress(addressDTO);

        when(cartClient.getCartItems(anyString())).thenReturn(Arrays.asList());

        // Execute & Verify
        assertThrows(CartEmptyException.class, () -> {
            orderService.placeOrder(orderDTO);
        });
    }

    @Test
    @DisplayName("TC-ORDER-003: Place Order - No Address")
    void testPlaceOrder_NoAddress() {
        // Setup
        OrderDTO orderDTO = new OrderDTO();
        // No address set

        List<CartItemDTO> cartItems = Arrays.asList(testCartItem);
        when(cartClient.getCartItems(anyString())).thenReturn(cartItems);

        // Execute & Verify
        assertThrows(IllegalArgumentException.class, () -> {
            orderService.placeOrder(orderDTO);
        });
    }

    @Test
    @DisplayName("TC-ORDER-013: Stock Deduction on Order")
    void testStockDeductionOnOrder() {
        // Setup
        AddressDTO addressDTO = new AddressDTO();
        addressDTO.setId(1L);

        OrderDTO orderDTO = new OrderDTO();
        orderDTO.setAddress(addressDTO);
        orderDTO.setPaymentMethod("RAZORPAY");

        List<CartItemDTO> cartItems = Arrays.asList(testCartItem);
        
        PaymentResponseDTO paymentResponse = new PaymentResponseDTO();
        paymentResponse.setOrderId("razorpay_order_123");
        paymentResponse.setStatus("created");

        ProductStockUpdateDTO stockUpdate = new ProductStockUpdateDTO();
        stockUpdate.setProductId(1L);
        stockUpdate.setQuantity(2);

        when(cartClient.getCartItems(anyString())).thenReturn(cartItems);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(orderItemRepository.saveAll(anyList())).thenReturn(Arrays.asList(new OrderItem()));
        when(paymentClient.initiatePayment(any(PaymentRequestDTO.class))).thenReturn(paymentResponse);
        when(modelMapper.map(any(Order.class), eq(OrderDTO.class))).thenReturn(testOrderDTO);
        doNothing().when(productClient).updateStock(anyList());
        doNothing().when(cartClient).clearCart(anyString());

        // Execute
        OrderDTO result = orderService.placeOrder(orderDTO);

        // Verify - Stock should be updated
        verify(productClient).updateStock(argThat(updates -> {
            return updates.size() == 1 && 
                   updates.get(0).getProductId() == 1L && 
                   updates.get(0).getQuantity() == 2;
        }));
    }

    @Test
    @DisplayName("TC-ORDER-016: Order Cancellation")
    void testOrderCancellation() {
        // Setup
        testOrder.setStatus("PLACED");
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(modelMapper.map(any(Order.class), eq(OrderDTO.class))).thenReturn(testOrderDTO);

        // Execute
        OrderDTO result = orderService.updateShipmentStatus(1L, "CANCELLED", "testuser");

        // Verify
        verify(orderRepository).save(argThat(order -> 
            order.getStatus().equals("CANCELLED")
        ));
    }

//    @Test
//    @DisplayName("TC-ORDER: Save Address")
//    void testSaveAddress() {
//        // Setup
//        AddressDTO addressDTO = new AddressDTO();
//        addressDTO.setStreet("123 Main St");
//        addressDTO.setCity("Mumbai");
//        addressDTO.setState("Maharashtra");
//        addressDTO.setZipCode("400001");
//
//        Address savedAddress = new Address();
//        savedAddress.setId(1L);
//        savedAddress.setStreet("123 Main St");
//        savedAddress.setUsername("testuser");
//
//        when(modelMapper.map(any(AddressDTO.class), eq(Address.class))).thenReturn(savedAddress);
//        when(addressRepository.save(any(Address.class))).thenReturn(savedAddress);
//
//        // Execute
//        Address result = orderService.saveAddress(addressDTO);
//
//        // Verify
//        assertNotNull(result);
//        assertEquals("testuser", result.getUsername());
//        verify(addressRepository).save(any(Address.class));
//    }

    @Test
    @DisplayName("TC-ORDER: Get Order History")
    void testGetOrderHistory() {
        // Setup
        List<Order> orders = Arrays.asList(testOrder);
        when(orderRepository.findByUsername("testuser")).thenReturn(orders);
        when(modelMapper.map(any(Order.class), eq(OrderDTO.class))).thenReturn(testOrderDTO);

        // Execute
        List<OrderDTO> result = orderService.getOrderHistoryWithItems();

        // Verify
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    @DisplayName("TC-ORDER: Get Order by ID")
    void testGetOrderById() {
        // Setup
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(modelMapper.map(any(Order.class), eq(OrderDTO.class))).thenReturn(testOrderDTO);

        // Execute
        OrderDTO result = orderService.getOrderById(1L);

        // Verify
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("TC-ORDER: Get Order by ID - Not Found")
    void testGetOrderById_NotFound() {
        // Setup
        when(orderRepository.findById(99999L)).thenReturn(Optional.empty());

        // Execute & Verify
        assertThrows(OrderNotFoundException.class, () -> {
            orderService.getOrderById(99999L);
        });
    }
}
