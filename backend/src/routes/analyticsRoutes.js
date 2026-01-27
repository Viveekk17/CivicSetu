const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeaderboard,
  getAQI,
  getDetailedAnalytics,
  getSubmissionsByCategory,
  getProgressTimeline
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
// Public routes
router.get('/aqi', getAQI);

// Protected routes
router.get('/leaderboard', protect, getLeaderboard);
router.get('/dashboard', protect, getDashboardStats);
router.get('/detailed', protect, getDetailedAnalytics);
router.get('/categories', protect, getSubmissionsByCategory);
router.get('/timeline', protect, getProgressTimeline);

module.exports = router;
