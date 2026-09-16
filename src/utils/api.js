import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token
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

// Add a response interceptor to handle global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the error is 401 Unauthorized, handle expired/invalid session
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      
      // Exclude all public authentication endpoints
      const isPublicAuthEndpoint =
        url.includes('/accounts/google') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password');

      // Check if the request originally included an AK Mobiles Authorization Bearer JWT
      const authHeader =
        error.config?.headers?.Authorization ||
        error.config?.headers?.authorization ||
        (typeof error.config?.headers?.get === 'function'
          ? error.config.headers.get('Authorization')
          : null);

      const hasBearerToken =
        typeof authHeader === 'string' &&
        authHeader.trim().startsWith('Bearer ');

      // Only trigger session expiration for authenticated protected requests
      if (!isPublicAuthEndpoint && hasBearerToken) {
        localStorage.removeItem('token');
        // Only show error and redirect if it's not a silent profile check on initial load
        if (url !== '/auth/profile') {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
