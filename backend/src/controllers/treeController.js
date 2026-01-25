const Tree = require('../models/Tree');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all available trees
// @route   GET /api/trees
// @access  Public
exports.getTrees = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = { available: true };
  if (category) {
    query.category = category;
  }

  const trees = await Tree.find(query).sort({ cost: 1 });

  res.json({
    success: true,
    count: trees.length,
    data: trees
  });
});

// @desc    Get single tree
// @route   GET /api/trees/:id
// @access  Public
exports.getTree = asyncHandler(async (req, res) => {
  const tree = await Tree.findById(req.params.id);

  if (!tree) {
    return res.status(404).json({
      success: false,
      message: 'Tree not found'
    });
  }

  res.json({
    success: true,
    data: tree
  });
});

// @desc    Redeem tree (purchase with credits)
// @route   POST /api/trees/:id/redeem
// @access  Private
exports.redeemTree = asyncHandler(async (req, res) => {
  const tree = await Tree.findById(req.params.id);

  if (!tree) {
    return res.status(404).json({
      success: false,
      message: 'Tree not found'
    });
  }

  if (!tree.available) {
    return res.status(400).json({
      success: false,
      message: 'This item is currently unavailable'
    });
  }

  // Get user
  const user = await User.findById(req.user.id);

  // Check if user has enough credits
  if (user.credits < tree.cost) {
    return res.status(400).json({
      success: false,
      message: `Insufficient credits. You need ${tree.cost} credits but only have ${user.credits}`
    });
  }

  // Deduct credits from user
  user.credits -= tree.cost;
  await user.save();

  // Create transaction record
  await Transaction.create({
    user: req.user.id,
    type: 'redeemed',
    amount: tree.cost,
    description: `Redeemed ${tree.name}`,
    metadata: {
      treeId: tree._id,
      treeName: tree.name,
      category: tree.category
    }
  });

  res.json({
    success: true,
    message: `Successfully redeemed ${tree.name}!`,
    data: {
      tree: tree,
      newBalance: user.credits,
      creditsSpent: tree.cost
    }
  });
});
