import axios from 'axios';
import { extractErrorInfo, logError } from '../utils/errorHandler';

const baseURL = import.meta.env.VITE_ORDER_API_BASE_URL || 'http://localhost:8083';

const apiOrder = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout
});

apiOrder.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    logError(error, 'OrderService.request');
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
apiOrder.interceptors.response.use(
  res => res,
  err => {
    // Log error for debugging
    logError(err, 'OrderService.response');
    
    // Extract error information
    const errorInfo = extractErrorInfo(err);
    
    // Handle 401 Unauthorized
    if (err.response?.status === 401) {
      localStorage.clear();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Enhance error object with sanitized message
    err.userMessage = errorInfo.message;
    err.errorType = errorInfo.type;
    
    return Promise.reject(err);
  }
);

export default apiOrder;
