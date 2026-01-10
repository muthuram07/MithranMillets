import axios from 'axios';
import { extractErrorInfo, logError } from '../utils/errorHandler';

// Determine base URL safely (Vite, CRA, fallback)
const baseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CART_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CART_API_BASE_URL) ||
  'http://localhost:8082';

const apiCartInstance = axios.create({
  baseURL: baseUrl,
  timeout: 30000, // 30 seconds timeout
  // withCredentials: true, // enable if backend uses cookies
});

// Attach bearer token like apiOrder
apiCartInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    logError(error, 'CartService.request');
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
apiCartInstance.interceptors.response.use(
  res => res,
  err => {
    // Log error for debugging
    logError(err, 'CartService.response');
    
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

// GET cart (expects array of CartItemDTO)
const getCart = () => apiCartInstance.get('/cart');

// POST add item: /cart/add/{productId}/{quantity}
const addItem = (productId, quantity) => apiCartInstance.post(`/cart/add/${productId}/${quantity}`);

// PATCH update quantity: /cart/update/{productId} body { quantity }
const updateQuantity = (productId, quantity) =>
  apiCartInstance.patch(`/cart/update/${productId}`, { quantity });

// DELETE remove by cart item id: /cart/remove/{id}
const removeById = (id) => apiCartInstance.delete(`/cart/remove/${id}`);

export default {
  instance: apiCartInstance,
  getCart,
  addItem,
  updateQuantity,
  removeById,
};
