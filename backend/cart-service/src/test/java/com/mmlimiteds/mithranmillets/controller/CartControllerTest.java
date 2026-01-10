package com.mmlimiteds.mithranmillets.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.QuantityUpdateRequest;
import com.mmlimiteds.mithranmillets.exception.CartItemNotFoundException;
import com.mmlimiteds.mithranmillets.exception.ProductUnavailableException;
import com.mmlimiteds.mithranmillets.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-CART Test Suite - Controller Layer Tests
 * Tests API contract validation as specified in TEST_CASES.md
 */
@WebMvcTest(CartController.class)
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    private CartItemDTO testCartItem;

    @BeforeEach
    void setUp() {
        testCartItem = new CartItemDTO();
        testCartItem.setId(1L);
        testCartItem.setProductId(1L);
        testCartItem.setProductName("Test Millet");
        testCartItem.setQuantity(2);
        testCartItem.setPrice(100.00);
    }

    @Test
    @DisplayName("TC-CART-001: Get Cart - Authenticated User")
    @WithMockUser(username = "testuser")
    void testGetCart_AuthenticatedUser() throws Exception {
        // Setup
        List<CartItemDTO> cartItems = Arrays.asList(testCartItem);
        when(cartService.getAllItems()).thenReturn(cartItems);

        // Execute & Verify
        mockMvc.perform(get("/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].productName").value("Test Millet"));
    }

    @Test
    @DisplayName("TC-CART-002: Get Cart - Empty Cart")
    @WithMockUser(username = "testuser")
    void testGetCart_EmptyCart() throws Exception {
        // Setup
        when(cartService.getAllItems()).thenReturn(Arrays.asList());

        // Execute & Verify
        mockMvc.perform(get("/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("TC-CART-003: Add Item to Cart - Valid Product")
    @WithMockUser(username = "testuser")
    void testAddItemToCart_ValidProduct() throws Exception {
        // Setup
        when(cartService.addItem(1L, 2)).thenReturn(testCartItem);

        // Execute & Verify
        mockMvc.perform(post("/cart/add/1/2")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.quantity").value(2));
    }

    @Test
    @DisplayName("TC-CART-004: Add Item to Cart - Product Unavailable")
    @WithMockUser(username = "testuser")
    void testAddItemToCart_ProductUnavailable() throws Exception {
        // Setup
        when(cartService.addItem(1L, 2))
                .thenThrow(new ProductUnavailableException(1L));

        // Execute & Verify
        mockMvc.perform(post("/cart/add/1/2")
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("unavailable")));
    }

    @Test
    @DisplayName("TC-CART-005: Add Item to Cart - Quantity Exceeds Stock")
    @WithMockUser(username = "testuser")
    void testAddItemToCart_QuantityExceedsStock() throws Exception {
        // Setup - Product has stock = 5, requested quantity = 10
        when(cartService.addItem(1L, 10))
                .thenThrow(new ProductUnavailableException(1L));

        // Execute & Verify
        mockMvc.perform(post("/cart/add/1/10")
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-CART-006: Update Cart Item Quantity")
    @WithMockUser(username = "testuser")
    void testUpdateCartItemQuantity() throws Exception {
        // Setup
        QuantityUpdateRequest updateRequest = new QuantityUpdateRequest();
        updateRequest.setQuantity(3);

        CartItemDTO updatedItem = new CartItemDTO();
        updatedItem.setId(1L);
        updatedItem.setQuantity(3);

        when(cartService.updateQuantity(1L, 3)).thenReturn(updatedItem);

        // Execute & Verify
        mockMvc.perform(patch("/cart/update/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    @DisplayName("TC-CART-007: Update Cart Item - Reduce Quantity")
    @WithMockUser(username = "testuser")
    void testUpdateCartItem_ReduceQuantity() throws Exception {
        // Setup
        QuantityUpdateRequest updateRequest = new QuantityUpdateRequest();
        updateRequest.setQuantity(2); // Reduced from 5

        CartItemDTO updatedItem = new CartItemDTO();
        updatedItem.setId(1L);
        updatedItem.setQuantity(2);

        when(cartService.updateQuantity(1L, 2)).thenReturn(updatedItem);

        // Execute & Verify
        mockMvc.perform(patch("/cart/update/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(2));
    }

    @Test
    @DisplayName("TC-CART-009: Remove Item from Cart")
    @WithMockUser(username = "testuser")
    void testRemoveItemFromCart() throws Exception {
        // Setup
        when(cartService.removeItem(1L)).thenReturn(true);

        // Execute & Verify
        mockMvc.perform(delete("/cart/remove/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("TC-CART-010: Remove Item - Invalid ID")
    @WithMockUser(username = "testuser")
    void testRemoveItem_InvalidId() throws Exception {
        // Setup
        when(cartService.removeItem(99999L))
                .thenThrow(new CartItemNotFoundException(99999L));

        // Execute & Verify
        mockMvc.perform(delete("/cart/remove/99999")
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC-CART-017: Unauthenticated Access")
    void testGetCart_Unauthenticated() throws Exception {
        // Execute & Verify - Should require authentication
        mockMvc.perform(get("/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TC-CART: Add Item - Invalid Quantity (Zero)")
    @WithMockUser(username = "testuser")
    void testAddItem_InvalidQuantity_Zero() throws Exception {
        // Execute & Verify - Quantity must be > 0
        mockMvc.perform(post("/cart/add/1/0")
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
