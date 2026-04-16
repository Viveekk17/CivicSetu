const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalProtect, protect } = require('../middleware/authMiddleware');

/**
 * @desc    Chat with CivicSetu Smart Assistant
 * @route   POST /api/chat
 * @access  Public (Context provided if authenticated)
 */
router.post('/', optionalProtect, chatController.handleChatMessage);

/**
 * @desc    Get chat history
 * @route   GET /api/chat/history
 * @access  Private
 */
router.get('/history', protect, chatController.getChatHistory);

module.exports = router;
