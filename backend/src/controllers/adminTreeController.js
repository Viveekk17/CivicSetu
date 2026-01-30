const TreeRedemption = require('../models/TreeRedemption');
const User = require('../models/User');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all tree redemption requests with filters
// @route   GET /api/admin/tree-redemptions
// @access  Admin
exports.getTreeRedemptions = asyncHandler(async (req, res) => {
    const { status, startDate, endDate, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (status) {
        query.status = status;
    }

    if (userId) {
        query.user = userId;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get redemptions with user info
    const redemptions = await TreeRedemption.find(query)
        .populate('user', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await TreeRedemption.countDocuments(query);

    res.json({
        success: true,
        count: redemptions.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: redemptions
    });
});

// @desc    Update tree redemption status
// @route   PATCH /api/admin/tree-redemptions/:id/status
// @access  Admin
exports.updateRedemptionStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'sent_to_ngo', 'planting_in_process', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
    }

    const redemption = await TreeRedemption.findById(req.params.id);

    if (!redemption) {
        return res.status(404).json({
            success: false,
            message: 'Tree redemption not found'
        });
    }

    // Add to status history
    redemption.statusHistory.push({
        status,
        updatedBy: req.user.id,
        notes: notes || '',
        timestamp: new Date()
    });

    // Update current status
    const previousStatus = redemption.status;
    redemption.status = status;

    // If marking as completed, increment user's tree count
    if (status === 'completed' && previousStatus !== 'completed') {
        const user = await User.findById(redemption.user);

        if (user) {
            user.impact = user.impact || { pollutionSaved: 0, treesPlanted: 0 };
            user.impact.treesPlanted += redemption.treesRequested;
            await user.save();

            redemption.completedAt = new Date();

            console.log(`🌳 Added ${redemption.treesRequested} trees to user ${user.name}. Total: ${user.impact.treesPlanted}`);
        }
    }

    if (notes) {
        redemption.adminNotes = notes;
    }

    await redemption.save();

    // Populate user info before sending response
    await redemption.populate('user', 'name email profilePicture');

    res.json({
        success: true,
        message: `Status updated to ${status}`,
        data: redemption
    });
});

// @desc    Get tree redemption statistics
// @route   GET /api/admin/tree-redemptions/stats
// @access  Admin
exports.getRedemptionStats = asyncHandler(async (req, res) => {
    const stats = await TreeRedemption.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalTrees: { $sum: '$treesRequested' },
                totalCredits: { $sum: '$creditsSpent' }
            }
        }
    ]);

    const totalRedemptions = await TreeRedemption.countDocuments();
    const pendingCount = await TreeRedemption.countDocuments({ status: 'pending' });
    const completedCount = await TreeRedemption.countDocuments({ status: 'completed' });

    const totalTreesPlanted = await TreeRedemption.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$treesRequested' } } }
    ]);

    res.json({
        success: true,
        data: {
            totalRedemptions,
            pendingCount,
            completedCount,
            totalTreesPlanted: totalTreesPlanted[0]?.total || 0,
            byStatus: stats
        }
    });
});
