const express = require('express');
const router = express.Router();
const {
  getTrees,
  getTree,
  redeemTree
} = require('../controllers/treeController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getTrees);
router.get('/:id', getTree);

// Protected routes
router.post('/:id/redeem', protect, redeemTree);

module.exports = router;
