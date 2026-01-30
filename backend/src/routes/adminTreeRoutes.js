const express = require('express');
const router = express.Router();
const {
    getTreeRedemptions,
    updateRedemptionStatus,
    getRedemptionStats
} = require('../controllers/adminTreeController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin auth
router.use(protect, admin);

// Statistics route (must be before /:id)
router.get('/stats', getRedemptionStats);

// Main routes
router.get('/', getTreeRedemptions);
router.patch('/:id/status', updateRedemptionStatus);

module.exports = router;
