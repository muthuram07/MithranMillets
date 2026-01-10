package com.mmlimiteds.mithranmillets.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

/**
 * Utility class to sanitize error messages before sending to clients
 * Hides sensitive technical details while maintaining user-friendly messages
 */
public class ErrorSanitizer {
    
    private static final Logger logger = LoggerFactory.getLogger(ErrorSanitizer.class);
    
    private static final Pattern STACK_TRACE_PATTERN = Pattern.compile("at .+?\\.java:\\d+");
    
    public static String sanitizeMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "An unexpected error occurred. Please try again later.";
        }
        
        String sanitized = message;
        sanitized = STACK_TRACE_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = sanitized.replaceAll("(java|com|org|net)\\.[a-z0-9.]+\\.", "");
        sanitized = sanitized.replaceAll("(Exception|Error|Throwable)(:|\\s)", "");
        sanitized = sanitized.replaceAll("\\s+", " ").trim();
        
        if (sanitized.isEmpty() || sanitized.length() < 10 || 
            containsTechnicalDetails(sanitized)) {
            return "An unexpected error occurred. Please try again later.";
        }
        
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 197) + "...";
        }
        
        return sanitized;
    }
    
    private static boolean containsTechnicalDetails(String message) {
        String lower = message.toLowerCase();
        return lower.contains("nullpointer") ||
               lower.contains("sql") ||
               lower.contains("database") ||
               lower.contains("connection") ||
               lower.contains("socket") ||
               lower.contains("http") ||
               lower.contains("jdbc") ||
               lower.contains("hibernate") ||
               lower.contains("entity") ||
               lower.contains("constraint");
    }
    
    public static void logError(Exception exception, String context) {
        logger.error("Error in {}: {}", context, exception.getMessage(), exception);
    }
    
    public static String getUserFriendlyMessage(Exception exception) {
        String exceptionName = exception.getClass().getSimpleName();
        
        if (exceptionName.contains("NotFound")) {
            return "The requested resource was not found.";
        }
        if (exceptionName.contains("AlreadyExists") || exceptionName.contains("Duplicate")) {
            return "This resource already exists. Please use a different value.";
        }
        if (exceptionName.contains("Invalid") || exceptionName.contains("BadRequest")) {
            return "The request was invalid. Please check your input and try again.";
        }
        if (exceptionName.contains("Unauthorized") || exceptionName.contains("Forbidden")) {
            return "You are not authorized to perform this action.";
        }
        if (exceptionName.contains("Timeout")) {
            return "The request took too long. Please try again.";
        }
        
        return "An unexpected error occurred. Please try again later.";
    }
}
