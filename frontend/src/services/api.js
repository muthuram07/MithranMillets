import axios from 'axios';
import { extractErrorInfo, logError } from '../utils/errorHandler';

const baseURL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:8085';

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout for better UX on mobile
});

// ✅ Only attach token for protected endpoints
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    // List of public endpoints that should NOT receive Authorization header
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/admin/check', '/auth/admin/setup'];

    const isPublic = publicPaths.some(path => config.url?.includes(path));

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    logError(error, 'AuthService.request');
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
api.interceptors.response.use(
  res => res,
  err => {
    // Log error for debugging
    logError(err, 'AuthService.response');
    
    // Extract error information
    const errorInfo = extractErrorInfo(err);
    
    // Handle 401 Unauthorized - redirect to login
    if (err.response?.status === 401) {
      localStorage.clear();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/login';
      }
    }

    // Enhance error object with sanitized message
    err.userMessage = errorInfo.message;
    err.errorType = errorInfo.type;
    
    return Promise.reject(err);
  }
);

export default api;
