const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserStats,
  searchUsers,
  uploadAvatar
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

router.get('/search', searchUsers); // Add search route
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.get('/stats', getUserStats);

module.exports = router;
