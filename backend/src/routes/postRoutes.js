const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPost,
    getPosts,
    toggleLike,
    addComment,
    deleteComment,
    getUserPosts,
    deletePost
} = require('../controllers/postController');

// Public routes
// Get all posts (public feed)
router.get('/', getPosts);

// Get posts by specific user
router.get('/user/:userId', getUserPosts);

// Protected routes
// Create post (protected)
router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.delete('/:id/comment/:commentId', protect, deleteComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
