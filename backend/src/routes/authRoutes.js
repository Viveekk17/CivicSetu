const express = require('express');
const router = express.Router();
const { register, login, firebaseLogin, getMe, completePhoneRegistration } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/firebase', firebaseLogin);
router.post('/register', register);
router.post('/login', login);
router.post('/phone-register', completePhoneRegistration);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
