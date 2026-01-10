package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.client.ProductClient;
import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.entity.CartItem;
import com.mmlimiteds.mithranmillets.exception.CartItemNotFoundException;
import com.mmlimiteds.mithranmillets.exception.ProductUnavailableException;
import com.mmlimiteds.mithranmillets.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * TC-CART Test Suite - Service Layer Tests
 * Tests business logic correctness as specified in TEST_CASES.md
 */
@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private ProductClient productClient;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CartService cartService;

    private CartItem testCartItem;
    private CartItemDTO testCartItemDTO;
    private ProductDTO testProductDTO;

    @BeforeEach
    void setUp() {
        // Setup security context
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");

        testCartItem = new CartItem();
        testCartItem.setId(1L);
        testCartItem.setUsername("testuser");
        testCartItem.setProductId(1L);
        testCartItem.setProductName("Test Millet");
        testCartItem.setQuantity(2);
        testCartItem.setPrice(100.00);

        testCartItemDTO = new CartItemDTO();
        testCartItemDTO.setId(1L);
        testCartItemDTO.setProductId(1L);
        testCartItemDTO.setProductName("Test Millet");
        testCartItemDTO.setQuantity(2);
        testCartItemDTO.setPrice(100.00);

        testProductDTO = new ProductDTO();
        testProductDTO.setId(1L);
        testProductDTO.setName("Test Millet");
        testProductDTO.setPrice(100.00);
        testProductDTO.setStock(50);
    }

    @Test
    @DisplayName("TC-CART-011: Cart Persistence Across Sessions")
    void testCartPersistence() {
        // Setup
        when(cartRepository.findByUsername("testuser")).thenReturn(Arrays.asList(testCartItem));
        when(modelMapper.map(any(CartItem.class), eq(CartItemDTO.class))).thenReturn(testCartItemDTO);

        // Execute
        List<CartItemDTO> items = cartService.getAllItems();

        // Verify
        assertEquals(1, items.size());
        assertEquals("Test Millet", items.get(0).getProductName());
    }

    @Test
    @DisplayName("TC-CART-012: Multiple Items in Cart")
    void testMultipleItemsInCart() {
        // Setup
        CartItem item2 = new CartItem();
        item2.setId(2L);
        item2.setProductId(2L);
        item2.setProductName("Another Millet");
        item2.setQuantity(3);

        CartItemDTO dto2 = new CartItemDTO();
        dto2.setId(2L);
        dto2.setProductId(2L);
        dto2.setProductName("Another Millet");
        dto2.setQuantity(3);

        when(cartRepository.findByUsername("testuser"))
                .thenReturn(Arrays.asList(testCartItem, item2));
        when(modelMapper.map(testCartItem, CartItemDTO.class)).thenReturn(testCartItemDTO);
        when(modelMapper.map(item2, CartItemDTO.class)).thenReturn(dto2);

        // Execute
        List<CartItemDTO> items = cartService.getAllItems();

        // Verify
        assertEquals(2, items.size());
    }

    @Test
    @DisplayName("TC-CART-013: Duplicate Product Addition")
    void testDuplicateProductAddition() {
        // Setup - Product already in cart with quantity 2
        when(cartRepository.findByUsernameAndProductId("testuser", 1L))
                .thenReturn(testCartItem); // Existing item

        CartItem updatedItem = new CartItem();
        updatedItem.setId(1L);
        updatedItem.setQuantity(3); // Updated quantity

        when(productClient.getProductById(1L)).thenReturn(testProductDTO);
        when(cartRepository.save(any(CartItem.class))).thenReturn(updatedItem);
        when(modelMapper.map(any(CartItem.class), eq(CartItemDTO.class))).thenReturn(testCartItemDTO);

        // Execute - Add same product again (should update quantity)
        CartItemDTO result = cartService.addItem(1L, 1);

        // Verify - Should update existing item, not create duplicate
        verify(cartRepository).save(any(CartItem.class));
        verify(cartRepository, never()).save(argThat(item -> 
            item.getId() == null && item.getProductId() == 1L
        ));
    }

    @Test
    @DisplayName("TC-CART-015: Real-time Stock Validation")
    void testRealTimeStockValidation() {
        // Setup - Product stock = 1
        ProductDTO lowStockProduct = new ProductDTO();
        lowStockProduct.setId(1L);
        lowStockProduct.setStock(1);

        when(productClient.getProductById(1L)).thenReturn(lowStockProduct);
        when(cartRepository.findByUsernameAndProductId("testuser", 1L)).thenReturn(null);
        when(cartRepository.save(any(CartItem.class))).thenReturn(testCartItem);
        when(modelMapper.map(any(CartItem.class), eq(CartItemDTO.class))).thenReturn(testCartItemDTO);

        // Execute - Add quantity 1 (should succeed)
        CartItemDTO result = cartService.addItem(1L, 1);

        // Verify
        assertNotNull(result);
        verify(productClient).getProductById(1L);
    }

    @Test
    @DisplayName("TC-CART: Stock Validation - Insufficient Stock")
    void testStockValidation_InsufficientStock() {
        // Setup - Product stock = 2, requested quantity = 5
        ProductDTO lowStockProduct = new ProductDTO();
        lowStockProduct.setId(1L);
        lowStockProduct.setStock(2);

        when(productClient.getProductById(1L)).thenReturn(lowStockProduct);
        when(cartRepository.findByUsernameAndProductId("testuser", 1L)).thenReturn(null);

        // Execute & Verify
        assertThrows(ProductUnavailableException.class, () -> {
            cartService.addItem(1L, 5);
        });
    }

    @Test
    @DisplayName("TC-CART: Update Quantity - Stock Check")
    void testUpdateQuantity_StockCheck() {
        // Setup
        ProductDTO product = new ProductDTO();
        product.setId(1L);
        product.setStock(10);

        when(cartRepository.findByUsernameAndProductId("testuser", 1L)).thenReturn(testCartItem);
        when(productClient.getProductById(1L)).thenReturn(product);
        when(cartRepository.save(any(CartItem.class))).thenReturn(testCartItem);
        when(modelMapper.map(any(CartItem.class), eq(CartItemDTO.class))).thenReturn(testCartItemDTO);

        // Execute
        CartItemDTO result = cartService.updateQuantity(1L, 5);

        // Verify
        assertNotNull(result);
        verify(productClient).getProductById(1L);
    }

    @Test
    @DisplayName("TC-CART: Remove Item - Valid ID")
    void testRemoveItem_ValidId() {
        // Setup
        when(cartRepository.findById(1L)).thenReturn(Optional.of(testCartItem));
        doNothing().when(cartRepository).deleteById(1L);

        // Execute
        boolean result = cartService.removeItem(1L);

        // Verify
        assertTrue(result);
        verify(cartRepository).deleteById(1L);
    }

    @Test
    @DisplayName("TC-CART: Remove Item - Invalid ID")
    void testRemoveItem_InvalidId() {
        // Setup
        when(cartRepository.findById(99999L)).thenReturn(Optional.empty());

        // Execute & Verify
        assertThrows(CartItemNotFoundException.class, () -> {
            cartService.removeItem(99999L);
        });
    }
}
