package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class CartExceptionHandler {

    @ExceptionHandler(ProductUnavailableException.class)
    public ResponseEntity<?> handleProductUnavailable(ProductUnavailableException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "CartService.handleProductUnavailable");
        String message = "The requested product is currently unavailable.";
        return buildResponse(HttpStatus.NOT_FOUND, "Product Error", message, request);
    }

    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<?> handleCartItemNotFound(CartItemNotFoundException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "CartService.handleCartItemNotFound");
        String message = "The cart item was not found. It may have been removed.";
        return buildResponse(HttpStatus.NOT_FOUND, "Cart Error", message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "CartService.handleGeneric");
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
