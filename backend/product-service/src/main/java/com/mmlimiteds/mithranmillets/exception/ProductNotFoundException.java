package com.mmlimiteds.mithranmillets.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found with ID: " + id);
    }
}
