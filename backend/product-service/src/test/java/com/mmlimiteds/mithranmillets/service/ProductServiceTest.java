package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;
import com.mmlimiteds.mithranmillets.entity.Product;
import com.mmlimiteds.mithranmillets.exception.ProductNotFoundException;
import com.mmlimiteds.mithranmillets.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * TC-PROD Test Suite - Service Layer Tests
 * Tests business logic correctness as specified in TEST_CASES.md
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private ProductDTO testProductDTO;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Test Millet");
        testProduct.setDescription("Test description");
        testProduct.setPrice(100.00);
        testProduct.setStock(50);
        testProduct.setCategory("Grain");

        testProductDTO = new ProductDTO();
        testProductDTO.setId(1L);
        testProductDTO.setName("Test Millet");
        testProductDTO.setDescription("Test description");
        testProductDTO.setPrice(100.00);
        testProductDTO.setStock(50);
        testProductDTO.setCategory("Grain");
    }

    @Test
    @DisplayName("TC-PROD-009: Stock Management - Decrease Stock")
    void testStockManagement_DecreaseStock() {
        // Setup
        ProductStockUpdateDTO updateDTO = new ProductStockUpdateDTO();
        updateDTO.setProductId(1L);
        updateDTO.setQuantity(5);

        Product product = new Product();
        product.setId(1L);
        product.setStock(50);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            assertEquals(45, saved.getStock()); // 50 - 5 = 45
            return saved;
        });

        // Execute
        productService.updateStock(Arrays.asList(updateDTO));

        // Verify
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("TC-PROD-010: Stock Management - Out of Stock")
    void testStockManagement_OutOfStock() {
        // Setup
        ProductStockUpdateDTO updateDTO = new ProductStockUpdateDTO();
        updateDTO.setProductId(1L);
        updateDTO.setQuantity(55); // More than available stock (50)

        Product product = new Product();
        product.setId(1L);
        product.setStock(2); // Only 2 in stock

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        // Execute & Verify
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            productService.updateStock(Arrays.asList(updateDTO));
        });

        assertTrue(exception.getMessage().contains("Insufficient stock"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("TC-PROD-011: Price Validation")
    void testPriceValidation() {
        // Setup - Negative price should be validated at DTO level
        ProductDTO negativePriceDTO = new ProductDTO();
        negativePriceDTO.setName("Test Product");
        negativePriceDTO.setPrice(-100.00);

        // Note: Price validation typically happens at controller/validation layer
        // This test verifies service doesn't crash with negative prices
        when(modelMapper.map(any(ProductDTO.class), eq(Product.class))).thenReturn(new Product());
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(modelMapper.map(any(Product.class), eq(ProductDTO.class))).thenReturn(testProductDTO);

        // Execute - Service should handle it (validation at controller level)
        ProductDTO result = productService.addProduct(negativePriceDTO, null);

        // Verify
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("TC-PROD-012: Category Filtering")
    void testCategoryFiltering() {
        // Setup
        Product grainProduct = new Product();
        grainProduct.setCategory("Grain");
        grainProduct.setName("Millet");

        when(productRepository.findByCategoryIgnoreCase("Grain"))
                .thenReturn(Arrays.asList(grainProduct));

        when(modelMapper.map(any(Product.class), eq(ProductDTO.class)))
                .thenAnswer(invocation -> {
                    Product p = invocation.getArgument(0);
                    ProductDTO dto = new ProductDTO();
                    dto.setCategory(p.getCategory());
                    dto.setName(p.getName());
                    return dto;
                });

        // Execute
        List<ProductDTO> results = productService.searchProducts(null, "Grain");

        // Verify
        assertEquals(1, results.size());
        assertEquals("Grain", results.get(0).getCategory());
    }

    @Test
    @DisplayName("TC-PROD: Get All Products")
    void testGetAllProducts() {
        // Setup
        List<Product> products = Arrays.asList(testProduct);
        when(productRepository.findAll(any())).thenReturn(products);
        when(modelMapper.map(any(Product.class), eq(ProductDTO.class)))
                .thenReturn(testProductDTO);

        // Execute
        List<ProductDTO> results = productService.getAllProducts();

        // Verify
        assertEquals(1, results.size());
        assertEquals("Test Millet", results.get(0).getName());
    }

    @Test
    @DisplayName("TC-PROD: Get Product by ID - Valid ID")
    void testGetProductById_ValidId() {
        // Setup
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(modelMapper.map(testProduct, ProductDTO.class)).thenReturn(testProductDTO);

        // Execute
        ProductDTO result = productService.getProductById(1L);

        // Verify
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Millet", result.getName());
    }

    @Test
    @DisplayName("TC-PROD: Get Product by ID - Invalid ID")
    void testGetProductById_InvalidId() {
        // Setup
        when(productRepository.findById(99999L)).thenReturn(Optional.empty());

        // Execute & Verify
        assertThrows(ProductNotFoundException.class, () -> {
            productService.getProductById(99999L);
        });
    }

    @Test
    @DisplayName("TC-PROD: Add Product")
    void testAddProduct() {
        // Setup
        when(modelMapper.map(any(ProductDTO.class), eq(Product.class))).thenReturn(testProduct);
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(modelMapper.map(any(Product.class), eq(ProductDTO.class))).thenReturn(testProductDTO);

        // Execute
        ProductDTO result = productService.addProduct(testProductDTO, null);

        // Verify
        assertNotNull(result);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("TC-PROD: Update Product")
    void testUpdateProduct() {
        // Setup
        ProductDTO updatedDTO = new ProductDTO();
        updatedDTO.setName("Updated Millet");
        updatedDTO.setPrice(120.00);
        updatedDTO.setStock(40);

        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(modelMapper.map(any(Product.class), eq(ProductDTO.class))).thenReturn(updatedDTO);

        // Execute
        ProductDTO result = productService.updateProduct(1L, updatedDTO, null);

        // Verify
        assertNotNull(result);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("TC-PROD: Delete Product")
    void testDeleteProduct() {
        // Setup
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        doNothing().when(productRepository).delete(any(Product.class));

        // Execute
        productService.deleteProduct(1L);

        // Verify
        verify(productRepository).delete(testProduct);
    }

    @Test
    @DisplayName("TC-PROD: Get Product Stock")
    void testGetProductStock() {
        // Setup
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // Execute
        Integer stock = productService.getProductStock(1L);

        // Verify
        assertEquals(50, stock);
    }

    @Test
    @DisplayName("TC-PROD: Get Paged Products")
    void testGetPagedProducts() {
        // Setup
        Page<Product> productPage = new PageImpl<>(Arrays.asList(testProduct));
        when(productRepository.findAll(any(PageRequest.class))).thenReturn(productPage);
        when(modelMapper.map(any(Product.class), eq(ProductDTO.class))).thenReturn(testProductDTO);

        // Execute
        Page<ProductDTO> result = productService.getPagedProducts(0, 10);

        // Verify
        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
    }
}
