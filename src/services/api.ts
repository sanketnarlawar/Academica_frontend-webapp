import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 errors (Unauthorized)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/login';
      }
      
      // Handle other errors
      const message = error.response.data?.message || 'An error occurred';
      console.error('API Error:', message);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
