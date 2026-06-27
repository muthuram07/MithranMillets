package com.mmlimiteds.mithranmillets.client;

import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "cart-service", url = "${CART_SERVICE_URL:http://localhost:8082}")
public interface CartClient {

    @GetMapping("/cart/internal/items")
    List<CartItemDTO> getCartItems(@RequestHeader("Authorization") String token);
    
    @DeleteMapping("/cart/internal/clear")
    void clearCart(@RequestHeader("Authorization") String token);
}

