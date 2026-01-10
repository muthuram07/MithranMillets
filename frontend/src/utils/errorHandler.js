/**
 * Centralized Error Handler Utility
 * Provides user-friendly error messages without exposing sensitive technical details
 */

/**
 * Maps HTTP status codes to user-friendly error messages
 */
const ERROR_MESSAGES = {
  400: "The request was invalid. Please check your input and try again.",
  401: "You are not authorized to perform this action. Please log in and try again.",
  403: "Access denied. You don't have permission to perform this action.",
  404: "The requested resource was not found. It may have been moved or deleted.",
  409: "A conflict occurred. This resource may already exist.",
  422: "The data provided is invalid. Please check your input and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "An internal server error occurred. Please try again later.",
  502: "The service is temporarily unavailable. Please try again later.",
  503: "The service is currently unavailable. Please try again later.",
  504: "The request timed out. Please check your connection and try again.",
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection and try again.",
  TIMEOUT_ERROR: "The request took too long. Please check your connection and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support if the problem persists."
};

/**
 * Sanitizes error messages to hide sensitive technical details
 * @param {Error|string} error - The error object or message
 * @param {number} statusCode - HTTP status code
 * @returns {string} - User-friendly error message
 */
export const sanitizeErrorMessage = (error, statusCode = null) => {
  // If error is a string, check if it contains technical details
  if (typeof error === 'string') {
    // Remove stack traces and technical paths
    const cleaned = error
      .replace(/at .+:\d+:\d+/g, '') // Remove stack trace lines
      .replace(/java\./gi, '') // Remove Java package names
      .replace(/com\./gi, '') // Remove package names
      .replace(/org\./gi, '') // Remove org package names
      .replace(/Exception/gi, '') // Remove exception class names
      .replace(/Error/gi, '') // Remove error class names
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // If the cleaned message is still meaningful, use it
    if (cleaned.length > 10 && cleaned.length < 200) {
      return cleaned;
    }
  }

  // Use status code-based message if available
  if (statusCode && ERROR_MESSAGES[statusCode]) {
    return ERROR_MESSAGES[statusCode];
  }

  // Check for common error patterns in error objects
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Handle different error response formats
    if (typeof data === 'string') {
      return sanitizeErrorMessage(data, statusCode);
    }
    
    if (data.message) {
      return sanitizeErrorMessage(data.message, statusCode);
    }
    
    if (data.error && typeof data.error === 'string') {
      // Sometimes error field contains user-friendly message
      const errorMsg = data.error.toLowerCase();
      if (!errorMsg.includes('exception') && !errorMsg.includes('java') && !errorMsg.includes('nullpointer')) {
        return data.error;
      }
    }
  }

  // Fallback to status code message or default
  return statusCode 
    ? ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.UNKNOWN_ERROR
    : ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Extracts error information from axios error or generic error
 * @param {Error} error - The error object
 * @returns {Object} - Error information with status, message, and type
 */
export const extractErrorInfo = (error) => {
  // Network error (no response from server)
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      status: null,
      message: ERROR_MESSAGES.TIMEOUT_ERROR,
      type: 'TIMEOUT'
    };
  }

  if (!error.response) {
    return {
      status: null,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      type: 'NETWORK'
    };
  }

  const status = error.response.status;
  const message = sanitizeErrorMessage(error, status);

  return {
    status,
    message,
    type: status >= 500 ? 'SERVER' : status >= 400 ? 'CLIENT' : 'UNKNOWN'
  };
};

/**
 * Logs error details for debugging (without exposing to user)
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'CartService.addItem')
 */
export const logError = (error, context = 'Unknown') => {
  // Only log in development or if explicitly enabled
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true') {
    console.error(`[Error in ${context}]:`, {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  // In production, you might want to send to error tracking service
  // Example: Sentry, LogRocket, etc.
};

/**
 * Handles errors and returns user-friendly message
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @returns {string} - User-friendly error message
 */
export const handleError = (error, context = 'Unknown') => {
  // Log error for debugging
  logError(error, context);
  
  // Extract and return user-friendly message
  const errorInfo = extractErrorInfo(error);
  return errorInfo.message;
};
