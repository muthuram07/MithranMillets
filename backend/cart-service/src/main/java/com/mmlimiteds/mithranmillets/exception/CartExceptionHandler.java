package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.Map;

@ControllerAdvice
public class CartExceptionHandler {

    @ExceptionHandler(ProductUnavailableException.class)
    public ResponseEntity<?> handleProductUnavailable(ProductUnavailableException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "Product Error", ex.getMessage(), request);
    }

    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<?> handleCartItemNotFound(CartItemNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "Cart Error", ex.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Error", ex.getMessage(), request);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String errorType, String message, WebRequest request) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", status.value(),
                "error", errorType,
                "message", message,
                "path", request.getDescription(false).replace("uri=", "")
        ));
    }
}
