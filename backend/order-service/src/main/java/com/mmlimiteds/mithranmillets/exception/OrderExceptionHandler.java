package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.Map;

@ControllerAdvice
public class OrderExceptionHandler {

    @ExceptionHandler(AddressNotFoundException.class)
    public ResponseEntity<?> handleAddressNotFound(AddressNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Address Error", ex.getMessage(), request);
    }

    @ExceptionHandler(CartEmptyException.class)
    public ResponseEntity<?> handleCartEmpty(CartEmptyException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Cart Error", ex.getMessage(), request);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<?> handleOrderNotFound(OrderNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "Order Error", ex.getMessage(), request);
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
