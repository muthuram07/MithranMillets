package com.mmlimiteds.mithranmillets.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() { super("Invalid username/email or password"); }
    public InvalidCredentialsException(String msg) { super(msg); }
}

