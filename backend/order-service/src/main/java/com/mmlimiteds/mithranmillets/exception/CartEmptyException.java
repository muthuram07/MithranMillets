package com.mmlimiteds.mithranmillets.exception;

public class CartEmptyException extends RuntimeException {
    public CartEmptyException(String username) {
        super("Cart is empty or not found for user: " + username);
    }
}
