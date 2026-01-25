const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getUserStats);

module.exports = router;
