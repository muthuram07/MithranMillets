package com.mmlimiteds.mithranmillets.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.QuantityUpdateRequest;
import com.mmlimiteds.mithranmillets.exception.ProductUnavailableException;
import com.mmlimiteds.mithranmillets.service.CartService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = "http://localhost:5174", allowCredentials = "true")
@Validated
public class CartController {

    @Autowired
    private CartService service;

    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getAll() {
        List<CartItemDTO> items = service.getAllItems();
        return ResponseEntity.ok(items);
    }

    @PostMapping("/add/{productId}/{quantity}")
    public ResponseEntity<?> addItem(@PathVariable Long productId, @PathVariable int quantity) {
        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than zero");
        }

        try {
            CartItemDTO added = service.addItem(productId, quantity);
            return ResponseEntity.ok(added);
        } catch (ProductUnavailableException e) {
            return ResponseEntity.badRequest().body("Product is unavailable or out of stock");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to add item: " + e.getMessage());
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateItem(@Valid @RequestBody CartItemDTO dto) {
        CartItemDTO updated = service.updateItem(dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/update/{productId}")
    public ResponseEntity<?> updateQuantity(
        @PathVariable Long productId,
        @Valid @RequestBody QuantityUpdateRequest req
    ) {
        if (req.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than zero");
        }

        try {
            CartItemDTO updated = service.updateQuantity(productId, req.getQuantity());
            return ResponseEntity.ok(updated);
        } catch (ProductUnavailableException e) {
            return ResponseEntity.badRequest().body("Product is unavailable or insufficient stock");
        }
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeItem(@PathVariable Long id) {
        service.removeItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/internal/items")
    public ResponseEntity<List<CartItemDTO>> getItemsForUser() {
        String username = service.getCurrentUsername();
        List<CartItemDTO> items = service.getAllItemsForUser(username);
        return ResponseEntity.ok(items);
    }

    @DeleteMapping("/internal/clear")
    public ResponseEntity<?> clearCartForUser() {
        String username = service.getCurrentUsername();
        service.clearCartForUser(username);
        return ResponseEntity.noContent().build();
    }
}
