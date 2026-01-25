import api from './api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  return await api.get('/analytics/dashboard');
};

// Get global leaderboard
export const getLeaderboard = async () => {
  return await api.get('/analytics/leaderboard');
};

// Get AQI data
export const getAQI = async () => {
  return await api.get('/analytics/aqi');
};
