package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class OrderExceptionHandler {

    @ExceptionHandler(AddressNotFoundException.class)
    public ResponseEntity<?> handleAddressNotFound(AddressNotFoundException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "OrderService.handleAddressNotFound");
        String message = "No address found. Please add a delivery address to continue.";
        return buildResponse(HttpStatus.BAD_REQUEST, "Address Error", message, request);
    }

    @ExceptionHandler(CartEmptyException.class)
    public ResponseEntity<?> handleCartEmpty(CartEmptyException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "OrderService.handleCartEmpty");
        String message = "Your cart is empty. Please add items to your cart before placing an order.";
        return buildResponse(HttpStatus.BAD_REQUEST, "Cart Error", message, request);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<?> handleOrderNotFound(OrderNotFoundException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "OrderService.handleOrderNotFound");
        String message = "The requested order was not found. It may have been deleted or does not exist.";
        return buildResponse(HttpStatus.NOT_FOUND, "Order Error", message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "OrderService.handleGeneric");
        String userMessage = ErrorSanitizer.getUserFriendlyMessage(ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Error", userMessage, request);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String errorType, String message, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", errorType);
        body.put("message", message);
        
        String path = request.getDescription(false).replace("uri=", "");
        if (path.startsWith("/")) {
            body.put("path", path);
        }
        
        return ResponseEntity.status(status).body(body);
    }
}
