const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeaderboard,
  getAQI
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/aqi', getAQI);

// Protected routes
router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
