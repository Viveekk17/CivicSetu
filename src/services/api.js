import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://ecotrace-ai.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token to all requests
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
  (response) => response.data, // Return just the data
  (error) => {
    // Don't redirect on login/register pages to avoid refresh
    const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

    if (error.response?.status === 401 && !isAuthPage) {
      // Unauthorized - clear token and redirect to login (only if not on auth pages)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Return error in a format we can use
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message: errorMessage, ...error.response?.data });
  }
);

export default api;
