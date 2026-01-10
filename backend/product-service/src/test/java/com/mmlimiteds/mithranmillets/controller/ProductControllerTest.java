package com.mmlimiteds.mithranmillets.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.exception.ProductNotFoundException;
import com.mmlimiteds.mithranmillets.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-PROD Test Suite - Controller Layer Tests
 * Tests API contract validation as specified in TEST_CASES.md
 */
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    private ProductDTO testProduct;

    @BeforeEach
    void setUp() {
        testProduct = new ProductDTO();
        testProduct.setId(1L);
        testProduct.setName("Test Millet");
        testProduct.setDescription("Test product description");
        testProduct.setPrice(100.00);
        testProduct.setStock(50);
        testProduct.setCategory("Grain");
    }

    @Test
    @DisplayName("TC-PROD-001: Get All Products")
    void testGetAllProducts() throws Exception {
        // Setup
        List<ProductDTO> products = Arrays.asList(testProduct);
        when(productService.getAllProducts()).thenReturn(products);

        // Execute & Verify
        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Test Millet"));
    }

    @Test
    @DisplayName("TC-PROD-002: Get Product by ID - Valid ID")
    void testGetProductById_ValidId() throws Exception {
        // Setup
        when(productService.getProductById(1L)).thenReturn(testProduct);

        // Execute & Verify
        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Millet"));
    }

    @Test
    @DisplayName("TC-PROD-003: Get Product by ID - Invalid ID")
    void testGetProductById_InvalidId() throws Exception {
        // Setup
        when(productService.getProductById(99999L))
                .thenThrow(new ProductNotFoundException(99999L));

        // Execute & Verify
        mockMvc.perform(get("/products/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC-PROD-004: Create Product - Admin Only")
    @WithMockUser(roles = "ADMIN")
    void testCreateProduct_Admin() throws Exception {
        // Setup
        ProductDTO newProduct = new ProductDTO();
        newProduct.setName("New Millet");
        newProduct.setPrice(150.00);
        newProduct.setStock(30);
        newProduct.setCategory("Grain");

        when(productService.addProduct(any(ProductDTO.class), any(MultipartFile.class)))
                .thenReturn(newProduct);

        // Execute & Verify
        mockMvc.perform(multipart("/products")
                        .file("product", objectMapper.writeValueAsBytes(newProduct))
                        .with(csrf())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-PROD-005: Create Product - Unauthorized User")
    @WithMockUser(roles = "USER")
    void testCreateProduct_Unauthorized() throws Exception {
        // Setup
        ProductDTO newProduct = new ProductDTO();
        newProduct.setName("New Millet");

        // Execute & Verify
        mockMvc.perform(multipart("/products")
                        .file("product", objectMapper.writeValueAsBytes(newProduct))
                        .with(csrf())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-PROD-006: Update Product - Valid Data")
    @WithMockUser(roles = "ADMIN")
    void testUpdateProduct_ValidData() throws Exception {
        // Setup
        ProductDTO updatedProduct = new ProductDTO();
        updatedProduct.setId(1L);
        updatedProduct.setName("Updated Millet");
        updatedProduct.setPrice(120.00);
        updatedProduct.setStock(40);

        when(productService.updateProduct(eq(1L), any(ProductDTO.class), any(MultipartFile.class)))
                .thenReturn(updatedProduct);

        // Execute & Verify
        mockMvc.perform(multipart("/products/1")
                        .file("product", objectMapper.writeValueAsBytes(updatedProduct))
                        .with(csrf())
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-PROD-012: Category Filtering")
    void testCategoryFiltering() throws Exception {
        // Setup
        List<ProductDTO> filteredProducts = Arrays.asList(testProduct);
        when(productService.searchProducts(null, "Grain")).thenReturn(filteredProducts);

        // Execute & Verify
        mockMvc.perform(get("/products/search")
                        .param("category", "Grain"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Grain"));
    }
}
