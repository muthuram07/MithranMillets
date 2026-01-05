package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;
import com.mmlimiteds.mithranmillets.entity.Product;
import com.mmlimiteds.mithranmillets.exception.ProductNotFoundException;
import com.mmlimiteds.mithranmillets.repository.ProductRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository repository;

    @Autowired
    private ModelMapper modelMapper;

    public List<ProductDTO> getAllProducts() {
    	return repository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")).stream()
                .map(this::toDtoWithoutImage)
                .collect(Collectors.toList());
    }

    public Page<ProductDTO> getPagedProducts(int page, int size) {
        Page<Product> products = repository.findAll(PageRequest.of(page, size));
        return products.map(this::toDtoWithoutImage);
    }

    public ProductDTO getProductById(Long id) {
        log.info("Fetching product with ID: {}", id);
        Product product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return toDtoWithoutImage(product);
    }

    public Integer getProductStock(Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return product.getStock();
    }

    public ProductDTO addProduct(ProductDTO dto, MultipartFile imageFile) {
        Product product = modelMapper.map(dto, Product.class);
        setImageIfPresent(product, imageFile);
        Product saved = repository.save(product);
        log.info("Added product: {}", saved.getId());
        return toDtoWithoutImage(saved);
    }

    public ProductDTO updateProduct(Long id, ProductDTO dto, MultipartFile imageFile) {
        Product existing = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        existing.setName(dto.getName());
        existing.setPrice(dto.getPrice());
        existing.setDescription(dto.getDescription());
        existing.setStock(dto.getStock());
        existing.setCategory(dto.getCategory());

        setImageIfPresent(existing, imageFile);

        Product updated = repository.save(existing);
        log.info("Updated product: {}", updated.getId());
        return toDtoWithoutImage(updated);
    }

    public List<ProductDTO> searchProducts(String name, String category) {
        List<Product> products;

        if (name != null && category != null) {
            products = repository.findByNameContainingIgnoreCaseAndCategoryIgnoreCase(name, category);
        } else if (name != null) {
            products = repository.findByNameContainingIgnoreCase(name);
        } else if (category != null) {
            products = repository.findByCategoryIgnoreCase(category);
        } else {
            products = repository.findAll();
        }

        return products.stream()
                .map(this::toDtoWithoutImage)
                .collect(Collectors.toList());
    }

    public void deleteProduct(Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        repository.delete(product);
        log.info("Deleted product: {}", id);
    }
    
    public void updateStock(List<ProductStockUpdateDTO> updates) {
        for (ProductStockUpdateDTO update : updates) {
            Product product = repository.findById(update.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(update.getProductId()));

            int newStock = product.getStock() - update.getQuantity();
            if (newStock < 0) {
                throw new IllegalStateException("Insufficient stock for product ID: " + update.getProductId());
            }

            product.setStock(newStock);
            repository.save(product);
        }
    }

    public byte[] getProductImage(Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        byte[] img = product.getImage();
        if (img == null || img.length == 0) {
            log.warn("Image not found for product ID: {}", id);
            throw new IllegalStateException("Image not found for product id: " + id);
        }
        log.info("Serving image for product ID: {}", id);
        return img;
    }

    public String getProductImageContentType(Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return product.getImageContentType() != null ? product.getImageContentType() : "image/jpeg";
    }

    private void setImageIfPresent(Product product, MultipartFile imageFile) {
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                product.setImage(imageFile.getBytes());
                product.setImageContentType(imageFile.getContentType());
                log.info("Stored image for product: {} (type: {})", product.getId(), imageFile.getContentType());
            } catch (IOException e) {
                log.error("Failed to read uploaded image", e);
                throw new RuntimeException("Failed to read uploaded image", e);
            }
        }
    }

    private ProductDTO toDtoWithoutImage(Product product) {
        ProductDTO dto = modelMapper.map(product, ProductDTO.class);
        dto.setHasImage(product.getImage() != null && product.getImage().length > 0);
        dto.setImageDownloadUrl("/products/" + product.getId() + "/image");
        return dto;
    }
}
