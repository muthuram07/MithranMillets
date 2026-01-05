package com.mmlimiteds.mithranmillets.exception;

public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(Long itemId) {
        super("Cart item not found: ID " + itemId);
    }
}
