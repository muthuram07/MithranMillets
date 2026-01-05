package com.mmlimiteds.mithranmillets.exception;

public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String action) {
        super("Unauthorized access to: " + action);
    }
}
