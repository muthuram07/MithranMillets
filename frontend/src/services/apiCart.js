import axios from 'axios';

// Determine base URL safely (Vite, CRA, fallback)
const baseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CART_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CART_API_BASE_URL) ||
  'http://localhost:8082';

const apiCartInstance = axios.create({
  baseURL: baseUrl,
  // withCredentials: true, // enable if backend uses cookies
});

// Attach bearer token like apiOrder
apiCartInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
