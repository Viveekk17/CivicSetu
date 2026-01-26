const express = require('express');
const router = express.Router();
const {
  getTrees,
  redeemTree,
  getRedemptionHistory
} = require('../controllers/redeemController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/trees', getTrees);

// Protected routes
router.post('/trees/:id', protect, redeemTree);
router.get('/history', protect, getRedemptionHistory);

module.exports = router;
