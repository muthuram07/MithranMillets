package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class PaymentExceptionHandler {

    @ExceptionHandler(PaymentInitiationException.class)
    public ResponseEntity<?> handlePaymentFailure(PaymentInitiationException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "PaymentService.handlePaymentFailure");
        // Never expose payment processing details to client for security
        String message = "Payment processing failed. Please try again or use a different payment method.";
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Payment Error", message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "PaymentService.handleGeneric");
        // For payment service, always use generic messages for security
        String message = ErrorSanitizer.getUserFriendlyMessage(ex);
        // Override if it's a payment-related exception
        if (ex.getClass().getSimpleName().contains("Payment") || 
            ex.getClass().getSimpleName().contains("Transaction")) {
            message = "Payment processing encountered an error. Please try again later or contact support.";
        }
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Error", message, request);
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
