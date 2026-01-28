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

  const query = {}; // Show all trees regardless of availability for now
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

  // Track trees planted if environmental category
  const environmentalCategories = ['trees', 'bundles'];
  if (environmentalCategories.includes(tree.category)) {
    user.impact = user.impact || { pollutionSaved: 0, treesPlanted: 0 };

    // Calculate tree count based on tree name
    let treeCount = 1; // Default single tree

    if (tree.category === 'bundles') {
      // Extract number from package name (e.g., "3 Trees Package" -> 3)
      const match = tree.name.match(/(\d+)\s+Trees/i);
      if (match) {
        treeCount = parseInt(match[1]);
      } else {
        treeCount = 10; // Default for bundles without number in name
      }
    }

    user.impact.treesPlanted += treeCount;
    console.log(`🌳 Added ${treeCount} tree(s) planted. Total: ${user.impact.treesPlanted}`);
  }

  await user.save();

  // Create transaction record


  // Add to inventory if it's a redeemable item (not an environmental donation)
  const inventoryCategories = ['transport', 'utilities', 'goodies'];
  if (inventoryCategories.includes(tree.category)) {
    user.inventory.push({
      itemId: tree._id,
      name: tree.name,
      category: tree.category
    });
    await user.save();
  }

  res.json({
    success: true,
    message: `Successfully redeemed ${tree.name}!`,
    data: {
      tree: tree,
      newBalance: user.credits,
      creditsSpent: tree.cost,
      user: { // Return full updated user for frontend sync
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        role: user.role,
        impact: user.impact,
        profilePicture: user.profilePicture
      }
    }
  });
});

// @desc    Get user inventory
// @route   GET /api/trees/inventory
// @access  Private
exports.getInventory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    count: user.inventory.length,
    data: user.inventory
  });
});

exports.useItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const inventoryId = req.params.itemId;

  // Find item index in inventory (using _id of the subdocument)
  const itemIndex = user.inventory.findIndex(item => item._id.toString() === inventoryId);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in inventory'
    });
  }

  const item = user.inventory[itemIndex];

  // Create transaction for usage
  await Transaction.create({
    user: req.user.id,
    type: 'redeemed', // Using 'redeemed' or create a new 'used' type if needed. keeping redeemed to show in history
    amount: 0, // No cost to use
    description: `Used ${item.name}`,
    metadata: {
      treeId: item.itemId,
      treeName: item.name,
      category: item.category,
      action: 'used'
    }
  });

  // Remove from inventory
  user.inventory.splice(itemIndex, 1);
  await user.save();

  res.json({
    success: true,
    message: `Successfully used ${item.name}`,
    data: user.inventory
  });
});
