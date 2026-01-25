const Tree = require('../models/Tree');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all available trees/items
// @route   GET /api/redeem/trees
// @access  Public
exports.getTrees = async (req, res) => {
  try {
    const { category } = req.query;

    const query = { available: true };
    if (category) {
      query.category = category;
    }

    const trees = await Tree.find(query).sort({ cost: 1 });

    res.json({
      success: true,
      data: trees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Redeem credits for tree
// @route   POST /api/redeem/trees/:id
// @access  Private
exports.redeemTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree/item not found'
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
        message: `Insufficient credits. You have ${user.credits}, need ${tree.cost}`
      });
    }

    // Deduct credits
    user.credits -= tree.cost;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'redeemed',
      amount: tree.cost,
      description: `Redeemed ${tree.name}`,
      metadata: {
        treeId: tree._id
      }
    });

    res.json({
      success: true,
      message: `Successfully redeemed ${tree.name}!`,
      data: {
        remainingCredits: user.credits,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's redemption history
// @route   GET /api/redeem/history
// @access  Private
exports.getRedemptionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'redeemed'
    })
      .populate('metadata.treeId', 'name image')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
