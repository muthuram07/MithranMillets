package com.mmlimiteds.mithranmillets.exception;

/**
 * Thrown when an Address cannot be found for a given id or username.
 */
public class AddressNotFoundException extends RuntimeException {

    public AddressNotFoundException() {
        super("Address not found");
    }

    public AddressNotFoundException(String message) {
        super(message);
    }

    public AddressNotFoundException(Long id) {
        super("Address not found with id: " + id);
    }

    public AddressNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public AddressNotFoundException(Throwable cause) {
        super(cause);
    }
}
