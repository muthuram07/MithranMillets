import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { handleError } from '../utils/errorHandler';

/**
 * Custom hook for handling errors in React components
 * Provides easy-to-use error handling with toast notifications
 * 
 * @example
 * const { showError } = useErrorHandler();
 * 
 * try {
 *   await apiCall();
 * } catch (error) {
 *   showError(error, 'Failed to load data');
 * }
 */
export const useErrorHandler = () => {
  /**
   * Displays a user-friendly error message via toast notification
   * @param {Error} error - The error object
   * @param {string} customMessage - Optional custom message to display
   * @param {string} context - Context where error occurred (for logging)
   */
  const showError = useCallback((error, customMessage = null, context = 'Component') => {
    // Use custom message if provided, otherwise extract user-friendly message
    const message = customMessage || handleError(error, context);
    
    // Display error toast
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  /**
   * Handles async errors in a cleaner way
   * @param {Function} asyncFn - Async function to execute
   * @param {string} errorMessage - Error message to show on failure
   * @returns {Promise} - Promise that resolves with the result or rejects with handled error
   */
  const handleAsyncError = useCallback(async (asyncFn, errorMessage = null) => {
    try {
      return await asyncFn();
    } catch (error) {
      showError(error, errorMessage);
      throw error; // Re-throw so caller can handle if needed
    }
  }, [showError]);

  return {
    showError,
    handleAsyncError,
  };
};

export default useErrorHandler;
