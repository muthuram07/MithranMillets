package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<?> handleProductNotFound(ProductNotFoundException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "ProductService.handleProductNotFound");
        String message = "The requested product was not found. It may have been removed or does not exist.";
        return buildResponse(HttpStatus.NOT_FOUND, "Product Error", message, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "ProductService.handleValidationErrors");
        String message = "Invalid product data. Please check all required fields and try again.";
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "ProductService.handleGeneric");
        String userMessage = ErrorSanitizer.getUserFriendlyMessage(ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Error", userMessage, request);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String errorType, String message, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", errorType);
        body.put("message", message);
        
        // Only include path in development mode for debugging
        String path = request.getDescription(false).replace("uri=", "");
        if (path.startsWith("/")) {
            body.put("path", path);
        }
        
        return ResponseEntity.status(status).body(body);
    }
}
