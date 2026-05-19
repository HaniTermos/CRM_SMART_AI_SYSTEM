import axios from 'axios';

// The backend URL is where our new Express server is running
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach the JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartstore_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses to handle global auth errors (e.g. 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and trigger re-auth logic
      localStorage.removeItem('smartstore_token');
      // A standard SPA pattern would be to dispatch a custom event or redirect
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);
