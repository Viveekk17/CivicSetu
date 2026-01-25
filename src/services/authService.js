import api from './api';

// Register new user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  
  // Store token and user data
  if (response.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response;
};

// Login user
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  // Store token and user data
  if (response.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Get current user
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get stored user data
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
