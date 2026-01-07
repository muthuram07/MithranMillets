import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8085',
});

// ✅ Only attach token for protected endpoints
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');

  // List of public endpoints that should NOT receive Authorization header
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/admin/check', '/auth/admin/setup'];

  const isPublic = publicPaths.some(path => config.url?.includes(path));

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
