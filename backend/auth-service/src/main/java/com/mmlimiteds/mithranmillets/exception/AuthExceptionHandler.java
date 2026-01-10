package com.mmlimiteds.mithranmillets.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<?> handleUserExists(UserAlreadyExistsException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "AuthService.handleUserExists");
        String userMessage = ErrorSanitizer.getUserFriendlyMessage(ex);
        String sanitizedMessage = ErrorSanitizer.sanitizeMessage(ex.getMessage());
        // Use custom message if available, otherwise use sanitized
        String message = userMessage.contains("unexpected") ? sanitizedMessage : userMessage;
        return buildResponse(HttpStatus.CONFLICT, "User Error", message, request);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<?> handleInvalidLogin(InvalidCredentialsException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "AuthService.handleInvalidLogin");
        // For invalid credentials, use the exception message if it's user-friendly
        String message = ex.getMessage() != null && !ex.getMessage().contains("Exception") 
            ? ex.getMessage() 
            : "Invalid email or password. Please check your credentials and try again.";
        return buildResponse(HttpStatus.UNAUTHORIZED, "Login Error", message, request);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedAccessException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "AuthService.handleUnauthorized");
        String message = "You don't have permission to access this resource.";
        return buildResponse(HttpStatus.FORBIDDEN, "Access Denied", message, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "AuthService.handleValidationErrors");
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> {
                    String field = err.getField();
                    String defaultMsg = err.getDefaultMessage();
                    // Make field names more user-friendly
                    String friendlyField = field.replaceAll("([A-Z])", " $1").trim();
                    return friendlyField + ": " + defaultMsg;
                })
                .collect(Collectors.joining("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Error", errors, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex, WebRequest request) {
        ErrorSanitizer.logError(ex, "AuthService.handleGeneric");
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
