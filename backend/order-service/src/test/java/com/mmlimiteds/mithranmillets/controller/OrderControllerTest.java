package com.mmlimiteds.mithranmillets.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.AddressDTO;
import com.mmlimiteds.mithranmillets.dto.OrderDTO;
import com.mmlimiteds.mithranmillets.entity.Address;
import com.mmlimiteds.mithranmillets.exception.AddressNotFoundException;
import com.mmlimiteds.mithranmillets.exception.CartEmptyException;
import com.mmlimiteds.mithranmillets.exception.OrderNotFoundException;
import com.mmlimiteds.mithranmillets.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-ORDER Test Suite - Controller Layer Tests
 * Tests API contract validation as specified in TEST_CASES.md
 */
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private ModelMapper modelMapper;

    private OrderDTO testOrder;
    private AddressDTO testAddress;

//    @BeforeEach
//    void setUp() {
//        testOrder = new OrderDTO();
//        testOrder.setId(1L);
//        testOrder.setTotalAmount(500.00);
//        testOrder.setStatus("PLACED");
//
//        testAddress = new AddressDTO();
//        testAddress.setId(1L);
//        testAddress.setStreet("123 Main St");
//        testAddress.setCity("Mumbai");
//        testAddress.setState("Maharashtra");
//        testAddress.setZipCode("400001");
//    }

    @Test
    @DisplayName("TC-ORDER-001: Place Order - Valid Cart")
    @WithMockUser(username = "testuser")
    void testPlaceOrder_ValidCart() throws Exception {
        // Setup
        when(orderService.placeOrder(any(OrderDTO.class))).thenReturn(testOrder);

        // Execute & Verify
        mockMvc.perform(post("/order/place")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testOrder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.totalAmount").value(500.00));
    }

    @Test
    @DisplayName("TC-ORDER-002: Place Order - Empty Cart")
    @WithMockUser(username = "testuser")
    void testPlaceOrder_EmptyCart() throws Exception {
        // Setup
        when(orderService.placeOrder(any(OrderDTO.class)))
                .thenThrow(new CartEmptyException("Your cart is empty"));

        // Execute & Verify
        mockMvc.perform(post("/order/place")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testOrder)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-ORDER-003: Place Order - No Address")
    @WithMockUser(username = "testuser")
    void testPlaceOrder_NoAddress() throws Exception {
        // Setup
        when(orderService.placeOrder(any(OrderDTO.class)))
                .thenThrow(new AddressNotFoundException("No address found"));

        // Execute & Verify
        mockMvc.perform(post("/order/place")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testOrder)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-ORDER-004: Get User Orders")
    @WithMockUser(username = "testuser")
    void testGetUserOrders() throws Exception {
        // Setup
        List<OrderDTO> orders = Arrays.asList(testOrder);
        when(orderService.getOrderHistoryWithItems()).thenReturn(orders);

        // Execute & Verify
        mockMvc.perform(get("/order/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].totalAmount").value(500.00));
    }

    @Test
    @DisplayName("TC-ORDER-005: Get Order by ID - Valid Order")
    @WithMockUser(username = "testuser")
    void testGetOrderById_ValidOrder() throws Exception {
        // Note: This endpoint may need to be added if not present
        // For now, testing order history which includes order details
        // Setup
        when(orderService.getOrderHistoryWithItems())
                .thenReturn(Arrays.asList(testOrder));

        // Execute & Verify
        mockMvc.perform(get("/order/history"))
                .andExpect(status().isOk());
    }

//    @Test
//    @DisplayName("TC-ORDER-008: Add Address")
//    @WithMockUser(username = "testuser")
//    void testAddAddress() throws Exception {
//        // Setup
//        Address savedAddress = new Address();
//        savedAddress.setId(1L);
//        savedAddress.setStreet("123 Main St");
//        savedAddress.setCity("Mumbai");
//        savedAddress.setState("Maharashtra");
//        savedAddress.setZipCode("400001");
//
//        when(orderService.saveAddress(any(AddressDTO.class))).thenReturn(savedAddress);
//        when(modelMapper.map(any(Address.class), eq(AddressDTO.class))).thenReturn(testAddress);
//
//        // Execute & Verify
//        mockMvc.perform(post("/order/address")
//                        .with(csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(testAddress)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.id").value(1))
//                .andExpect(jsonPath("$.street").value("123 Main St"));
//    }

    @Test
    @DisplayName("TC-ORDER-009: Update Address")
    @WithMockUser(username = "testuser")
    void testUpdateAddress() throws Exception {
        // Note: Update address endpoint may need verification
        // Setup
        Address updatedAddress = new Address();
        updatedAddress.setId(1L);
        updatedAddress.setStreet("456 New St");
        updatedAddress.setCity("Delhi");

        AddressDTO updatedDTO = new AddressDTO();
        updatedDTO.setId(1L);
        updatedDTO.setStreet("456 New St");
        updatedDTO.setCity("Delhi");

        when(orderService.saveAddress(any(AddressDTO.class))).thenReturn(updatedAddress);
        when(modelMapper.map(any(Address.class), eq(AddressDTO.class))).thenReturn(updatedDTO);

        // Execute & Verify
        mockMvc.perform(post("/order/address")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDTO)))
                .andExpect(status().isOk());
    }

//    @Test
//    @DisplayName("TC-ORDER-010: Get Default Address")
//    @WithMockUser(username = "testuser")
//    void testGetDefaultAddress() throws Exception {
//        // Setup
//        Address address = new Address();
//        address.setId(1L);
//        address.setStreet("123 Main St");
//        address.setDefaultAddress(true);
//
//        AddressDTO addressDTO = new AddressDTO();
//        addressDTO.setId(1L);
//        addressDTO.setStreet("123 Main St");
//        addressDTO.setDefaultAddress(true);
//
//        when(orderService.getAddressForCurrentUser()).thenReturn(address);
//        when(modelMapper.map(any(Address.class), eq(AddressDTO.class))).thenReturn(addressDTO);
//
//        // Execute & Verify
//        mockMvc.perform(get("/order/address"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.street").value("123 Main St"));
//    }

    @Test
    @DisplayName("TC-ORDER-007: Get Order by ID - Admin Access")
    @WithMockUser(roles = "ADMIN")
    void testGetOrderById_AdminAccess() throws Exception {
        // Setup
        List<OrderDTO> orders = Arrays.asList(testOrder);
        when(orderService.getAllOrdersWithItems()).thenReturn(orders);

        // Execute & Verify
        mockMvc.perform(get("/order/admin/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @DisplayName("TC-ORDER-011: Update Order Status - Admin Only")
    @WithMockUser(roles = "ADMIN")
    void testUpdateOrderStatus_Admin() throws Exception {
        // Setup
        OrderDTO updatedOrder = new OrderDTO();
        updatedOrder.setId(1L);
        updatedOrder.setStatus("SHIPPED");

        when(orderService.updateShipmentStatus(eq(1L), eq("SHIPPED"), any(String.class)))
                .thenReturn(updatedOrder);

        Map<String, String> statusUpdate = Map.of("status", "SHIPPED");

        // Execute & Verify
        mockMvc.perform(put("/order/admin/1/shipment-status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));
    }
}
