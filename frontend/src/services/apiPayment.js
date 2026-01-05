import axios from 'axios';

const apiPayment = axios.create({
  baseURL: 'http://localhost:8084',
});

apiPayment.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiPayment;
