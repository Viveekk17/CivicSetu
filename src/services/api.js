import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(' API Request:', config.method.toUpperCase(), config.url);
    console.log(' Token found in localStorage:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(' Authorization header set');
    } else {
      console.log('️ No token found - request will fail if protected');
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
    console.log(' API Response:', response.config.url, 'Status:', response.status);
    return response.data;
  },
  (error) => {
    console.log(' API Error:', error.config?.url);
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);

    const path = window.location.pathname;
    // Don't bounce off the landing or admin login when their own auth probes fail
    const isAuthSurface = path === '/' || path === '/admin/login';

    if (error.response?.status === 401 && !isAuthSurface) {
      console.log(' 401 Unauthorized - clearing auth and redirecting');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (path.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/';
      }
    }

    // Return error in a format we can use
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message: errorMessage, ...error.response?.data });
  }
);

export const searchCommunities = async (query) => {
  try {
    const response = await api.get(`/communities/search?q=${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getGlobalImpact = () => api.get('/analytics/global-impact');

export default api;
