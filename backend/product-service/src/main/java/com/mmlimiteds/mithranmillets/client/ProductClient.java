package com.mmlimiteds.mithranmillets.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mmlimiteds.mithranmillets.dto.ProductDTO;

@FeignClient(name = "product-service", url = "http://localhost:8081")
public interface ProductClient {
  @GetMapping("/products/{id}")
  ProductDTO getProductById(@PathVariable Long id);
}
