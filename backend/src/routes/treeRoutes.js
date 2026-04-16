const express = require('express');
const router = express.Router();
const {
  getTrees,
  getTree,
  redeemTree,
  getInventory,
  useItem,
  getMyRedemptions
} = require('../controllers/treeController');
const { protect } = require('../middleware/authMiddleware');

// Inventory routes (Must be before /:id)
router.get('/inventory', protect, getInventory);
router.post('/inventory/:itemId/use', protect, useItem);

// Redemption history route
router.get('/my-redemptions', protect, getMyRedemptions);

// Public routes
router.get('/', getTrees);
router.get('/:id', getTree);

// Protected routes
router.post('/:id/redeem', protect, redeemTree);



module.exports = router;
