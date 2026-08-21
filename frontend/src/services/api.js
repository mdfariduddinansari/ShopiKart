import axios from 'axios';

const BASE_URL = 'https://shopikart-53s0.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const url = error.config?.url || '';
    
    // Handle authentication errors - but NOT for login/register endpoints
    if (error.response?.status === 401) {
      // Allow login and register endpoints to handle their own 401 errors
      const isAuthEndpoint = url.includes('/users/login') || (url.includes('/users') && !url.includes('/profile') && !url.includes('/orders'));
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('userToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject({ message });
  }
);

export default api;


