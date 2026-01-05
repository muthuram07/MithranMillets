package com.mmlimiteds.mithranmillets.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;
import com.mmlimiteds.mithranmillets.exception.ProductNotFoundException;
import com.mmlimiteds.mithranmillets.service.ProductService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "http://localhost:5174")
public class ProductController {
	
	private static final Logger log = LoggerFactory.getLogger(ProductService.class);

	
    @Autowired
    private ProductService service;
    
    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAll() {
        return ResponseEntity.ok(service.getAllProducts());
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<ProductDTO>> getPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getPagedProducts(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProductById(id));
    }

    @GetMapping("/{id}/stock")
    public ResponseEntity<Integer> getStock(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProductStock(id));
    }

    /**
     * Add product with optional image.
     * Accepts multipart/form-data where:
     * - product is JSON string in "product" part
     * - image is optional file in "image" part
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> add(
    		@RequestPart("product") String product,
            @RequestPart(value = "image", required = false) MultipartFile image) {
    	ProductDTO dto;
        try {
            dto = objectMapper.readValue(product, ProductDTO.class);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        ProductDTO saved = service.addProduct(dto, image);
        return ResponseEntity.ok(saved);
    }

    /**
     * Update product with optional image replacement.
     */
    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> update(
            @PathVariable Long id,
            @RequestPart("product") String product,
            @RequestPart(value = "image", required = false) MultipartFile image) {
    	ProductDTO dto;
        try {
            dto = objectMapper.readValue(product, ProductDTO.class);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        ProductDTO updated = service.updateProduct(id, dto, image);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(service.searchProducts(name, category));
    }

    @PutMapping("/update-stock") // ✅ Final path: /product/update-stock
    public ResponseEntity<?> updateStock(@RequestBody List<ProductStockUpdateDTO> updates) {
        try {
            service.updateStock(updates);
            return ResponseEntity.ok("Stock updated");
        } catch (ProductNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Update failed: " + e.getMessage());
        }
    }
    @GetMapping("/{id}/image")
    public ResponseEntity<ByteArrayResource> getImage(@PathVariable Long id) {
        try {
            byte[] image = service.getProductImage(id);
            String contentType = service.getProductImageContentType(id);
            ByteArrayResource resource = new ByteArrayResource(image);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl(CacheControl.noCache());

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
        } catch (ProductNotFoundException e) {
            log.warn("Product not found for image request: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.warn("No image available for product ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Unexpected error serving image for product ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteProduct(id);
            return ResponseEntity.ok().build();
        } catch (ProductNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Delete failed: " + e.getMessage());
        }
    }

}
