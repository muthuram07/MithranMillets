import axios from 'axios';
import { extractErrorInfo, logError } from '../utils/errorHandler';

const apiPayment = axios.create({
  baseURL: 'http://localhost:8084',
  timeout: 30000, // 30 seconds timeout
});

apiPayment.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    logError(error, 'PaymentService.request');
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
apiPayment.interceptors.response.use(
  res => res,
  err => {
    // Log error for debugging
    logError(err, 'PaymentService.response');
    
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

export default apiPayment;
