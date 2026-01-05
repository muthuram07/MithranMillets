package com.mmlimiteds.mithranmillets.exception;

public class ProductUnavailableException extends RuntimeException {
    public ProductUnavailableException(Long productId) {
        super("Product not found or unavailable: ID " + productId);
    }
}
