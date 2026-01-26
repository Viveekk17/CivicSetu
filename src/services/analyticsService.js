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

// Get detailed analytics for analytics page
export const getDetailedAnalytics = async (period = '1year') => {
  return await api.get(`/analytics/detailed?period=${period}`);
};

// Get submissions by category
export const getSubmissionsByCategory = async () => {
  return await api.get('/analytics/categories');
};

// Get progress timeline
export const getProgressTimeline = async () => {
  return await api.get('/analytics/timeline');
};

