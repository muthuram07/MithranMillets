import axios from 'axios';

const apiOrder = axios.create({
  baseURL: 'http://localhost:8083',
});

apiOrder.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiOrder;
