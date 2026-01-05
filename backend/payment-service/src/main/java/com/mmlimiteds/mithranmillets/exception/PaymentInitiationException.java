package com.mmlimiteds.mithranmillets.exception;

public class PaymentInitiationException extends RuntimeException {
    public PaymentInitiationException(String message) {
        super("Payment initiation failed: " + message);
    }
}
