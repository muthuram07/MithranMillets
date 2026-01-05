package com.mmlimiteds.mithranmillets.client;

import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import org.springframework.stereotype.Component;

@Component
public class ProductClientFallback implements ProductClient {

    @Override
    public ProductDTO getProductById(Long id) {
        ProductDTO fallbackProduct = new ProductDTO();
        fallbackProduct.setId(id);
        fallbackProduct.setName("Unavailable");
        fallbackProduct.setPrice(0.0);
        fallbackProduct.setStock(0);
        fallbackProduct.setDescription("Product service is currently unavailable.");
        fallbackProduct.setHasImage(false); // ✅ No image available
        fallbackProduct.setImageDownloadUrl("/products/default/image"); // ✅ Optional fallback image path
        fallbackProduct.setCategory("Unknown");
        return fallbackProduct;
    }
}
