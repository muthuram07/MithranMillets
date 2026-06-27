package com.mmlimiteds.mithranmillets.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mmlimiteds.mithranmillets.dto.ProductStockUpdateDTO;

import java.util.List;

@FeignClient(name = "product-service", url = "${PRODUCT_SERVICE_URL:http://localhost:8081}")
public interface ProductClient {

	 @PutMapping("/products/update-stock") 
	    void updateStock(@RequestBody List<ProductStockUpdateDTO> updates);
}
