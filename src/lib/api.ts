import axios from 'axios';
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartstore_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 'NETWORK_ERROR';
    const method = (error.config?.method || 'GET').toUpperCase();
    const url = error.config?.url || 'unknown';
    const responseData = error.response?.data;
    const errorDetails =
      typeof responseData === 'object'
        ? JSON.stringify(responseData)
        : responseData || error.message;

    console.error(`🚨 [FRONTEND API ERROR ${status}] ${method} ${url} | Details: ${errorDetails}`);

    if (error.response?.status === 401) {
      localStorage.removeItem('smartstore_token');
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);
