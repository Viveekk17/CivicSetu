const User = require('../models/User');
const Submission = require('../models/Submission');
const Report = require('../models/Report');
const Community = require('../models/Community');
const Transaction = require('../models/Transaction');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // KPI Metrics
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });
    const openReports = await Report.countDocuments({ status: 'open' });
    const totalImpact = await User.aggregate([
        { $group: { _id: null, totalPollution: { $sum: "$impact.pollutionSaved" }, totalTrees: { $sum: "$impact.treesPlanted" } } }
    ]);

    // 7-Day Metrics
    const newUsersLast7Days = await User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: sevenDaysAgo }
    });

    const activitiesLast7Days = await Submission.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });

    // Recent Activity Stats
    const totalSubmissions = await Submission.countDocuments();
    const activeCommunities = await Community.countDocuments();

    const totalCreditsAgg = await User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: null, total: { $sum: '$credits' } } }
    ]);

    // Recent activities for timeline
    const recentSubmissions = await Submission.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email profilePicture')
        .lean();

    const recentRedemptions = await Transaction.find({ type: 'deduct' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .lean();

    const allActivities = [
        ...recentSubmissions.map(s => ({ ...s, activityType: 'submission' })),
        ...recentRedemptions.map(r => ({ ...r, activityType: 'redemption' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    res.json({
        success: true,
        data: {
            kpi: {
                users: totalUsers,
                pendingSubmissions,
                openReports,
                totalPollutionSaved: totalImpact[0]?.totalPollution || 0,
                totalTreesPlanted: totalImpact[0]?.totalTrees || 0
            },
            sevenDay: {
                newUsers: newUsersLast7Days,
                activities: activitiesLast7Days
            },
            recent: {
                totalSubmissions,
                activeCommunities,
                totalCredits: totalCreditsAgg[0]?.total || 0
            },
            recentActivities: allActivities
        }
    });
});

// @desc    Get All Submissions
// @route   GET /api/admin/submissions
// @access  Private/Admin
exports.getSubmissions = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = status && status !== 'All' ? { status: status.toLowerCase() } : {};

    const submissions = await Submission.find(query)
        .populate('user', 'name email profilePicture')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: submissions.length,
        data: submissions
    });
});

// @desc    Verify/Reject Submission
// @route   PUT /api/admin/submissions/:id
// @access  Private/Admin
exports.updateSubmissionStatus = asyncHandler(async (req, res) => {
    const { status, points, notes } = req.body; // status: 'verified' | 'rejected'

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Submission already processed' });
    }

    submission.status = status;
    submission.verificationDetails = {
        verifiedAt: Date.now(),
        verifiedBy: 'Admin', // Could handle via auth user name
        notes: notes || ''
    };

    if (status === 'verified') {
        // Calculate credits to award (default 50 or custom)
        const creditsToAward = points ? parseInt(points) : 50;
        submission.creditsAwarded = creditsToAward;

        // Update User Credits & Impact
        const user = await User.findById(submission.user);
        if (user) {
            user.credits += creditsToAward;

            // Should probably determine impact based on submission type
            // Simple mock logic for now
            if (submission.type === 'garbage') {
                user.impact.pollutionSaved += (submission.weight || 5); // 5kg default
            } else if (submission.type === 'restoration') {
                user.impact.treesPlanted += 1;
            }

            await user.save();
        }
    }

    await submission.save();

    res.json({
        success: true,
        data: submission
    });
});

// @desc    Get All User Reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = status && status !== 'All' ? { status: status.toLowerCase() } : {};

    const reports = await Report.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Update Report Status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReportStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.json({
        success: true,
        data: report
    });
});

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: { $ne: 'admin' } }) // Exclude admins
        .select('-password')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: users.length,
        data: users
    });
});

// @desc    Get All Communities
// @route   GET /api/admin/communities
// @access  Private/Admin
exports.getCommunities = asyncHandler(async (req, res) => {
    const communities = await Community.find()
        .populate('creator', 'name email')
        .sort({ 'stats.totalPollutionSaved': -1 });

    res.json({
        success: true,
        count: communities.length,
        data: communities
    });
});

// @desc    Get All Transactions (Earned + Redeemed)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find()
        .populate('user', 'name email profilePicture')
        .populate('metadata.treeId', 'name cost')
        .sort({ createdAt: -1 })
        .limit(100); // Limit to recent 100

    // Group by type
    const earned = transactions.filter(tx => tx.type === 'earned');
    const redeemed = transactions.filter(tx => tx.type === 'redeemed');

    res.json({
        success: true,
        data: {
            all: transactions,
            earned,
            redeemed
        }
    });
});

// @desc    Get Enhanced Analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
    // 1. Department/Category Distribution (Reports)
    const reportDistribution = await Report.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // 2. Submission Trends (Last 6 Months) - Group by Month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const submissionTrends = await Submission.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // 3. User Growth (Last 6 Months)
    const userGrowth = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            reportsByCategory: reportDistribution,
            submissionTrends,
            userGrowth
        }
    });
});

// @desc    Get Single Community Details
// @route   GET /api/admin/communities/:id
// @access  Private/Admin
exports.getCommunityDetails = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id)
        .populate('creator', 'name email')
        .populate('members', 'name email profilePicture impact');

    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    res.json({
        success: true,
        data: community
    });
});

// @desc    Update User Credits Manually
// @route   PUT /api/admin/users/:id/credits
// @access  Private/Admin
exports.updateUserCredits = asyncHandler(async (req, res) => {
    const { amount, reason, action } = req.body; // action: 'add' or 'deduct'
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const creditAmount = parseInt(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (action === 'add') {
        user.credits += creditAmount;
    } else if (action === 'deduct') {
        user.credits = Math.max(0, user.credits - creditAmount);
    } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    // Optional: Create a transaction record (using 'earned' for add, 'redeemed' for deduct implies shop but works for tracking)
    // For admin adjustments, maybe we need a new type 'adjustment' but using 'earned'/'redeemed' for now or just skipping for simplicity unless requested.
    // The user requirement said "manage their credits", simple update is sufficient for MVP, but a transaction log is better.
    // Let's create a transaction for transparency.
    await Transaction.create({
        user: user._id,
        type: action === 'add' ? 'earned' : 'redeemed',
        amount: creditAmount,
        description: `Admin Adjustment: ${reason || 'Manual Update'}`
    });

    await user.save();


    res.json({
        success: true,
        data: user
    });
});

// @desc    Get Single User Details with Submissions
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch all user's submissions
    const submissions = await Submission.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .select('photos location status creditsAwarded createdAt');

    res.json({
        success: true,
        data: {
            user,
            submissions
        }
    });
});

// @desc    Update Submission Credits
// @route   PATCH /api/admin/submissions/:id/credits
// @access  Private/Admin
exports.updateSubmissionCredits = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { creditsAwarded } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const oldCredits = submission.creditsAwarded;
    const creditDifference = creditsAwarded - oldCredits;

    // Update submission
    submission.creditsAwarded = creditsAwarded;
    await submission.save();

    // Update user credits
    await User.findByIdAndUpdate(submission.user, {
        $inc: { credits: creditDifference }
    });

    // Update or create transaction
    const existingTransaction = await Transaction.findOne({
        'metadata.submissionId': id,
        type: 'earned'
    });

    if (existingTransaction) {
        existingTransaction.amount = creditsAwarded;
        await existingTransaction.save();
    } else {
        await Transaction.create({
            user: submission.user,
            type: 'earned',
            amount: creditsAwarded,
            description: `Credits from ${submission.type} submission`,
            metadata: { submissionId: id }
        });
    }

    res.json({
        success: true,
        message: 'Credits updated successfully',
        data: { oldCredits, newCredits: creditsAwarded, difference: creditDifference }
    });
});

// @desc    Delete Submission
// @route   DELETE /api/admin/submissions/:id
// @access  Private/Admin
exports.deleteSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Reverse credits if any were awarded
    if (submission.creditsAwarded > 0) {
        await User.findByIdAndUpdate(submission.user, {
            $inc: { credits: -submission.creditsAwarded }
        });
    }

    // Delete related transaction
    await Transaction.deleteMany({
        'metadata.submissionId': id
    });

    // Delete submission
    await Submission.findByIdAndDelete(id);

    res.json({
        success: true,
        message: 'Submission deleted successfully',
        data: { creditsReversed: submission.creditsAwarded }
    });
});

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
        return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }

    // Delete user's submissions
    const deletedSubmissions = await Submission.deleteMany({ user: id });

    // Delete user's transactions
    const deletedTransactions = await Transaction.deleteMany({ user: id });

    // Remove user from communities
    await Community.updateMany(
        { members: id },
        { $pull: { members: id } }
    );

    // Delete user's reports
    await Report.deleteMany({ user: id });

    // Delete user account
    await User.findByIdAndDelete(id);

    res.json({
        success: true,
        message: 'User and all related data deleted successfully',
        data: {
            submissionsDeleted: deletedSubmissions.deletedCount,
            transactionsDeleted: deletedTransactions.deletedCount
        }
    });
});

// @desc    Get Dashboard Analytics with Charts Data
// @route   GET /api/admin/dashboard-analytics
// @access  Private/Admin
exports.getDashboardAnalytics = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Submissions Timeline (last 30 days, day-wise)
    const submissionsTimeline = await Submission.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 },
                credits: { $sum: "$creditsAwarded" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // User Registration Timeline (last 30 days)
    const userGrowth = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo },
                role: { $ne: 'admin' }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Category Breakdown
    const categoryBreakdown = await Submission.aggregate([
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalCredits: { $sum: "$creditsAwarded" }
            }
        }
    ]);

    // Engagement Metrics
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await Submission.distinct('user', {
        createdAt: { $gte: thirtyDaysAgo }
    });
    const totalSubmissions = await Submission.countDocuments();
    const avgSubmissionsPerUser = totalUsers > 0 ? (totalSubmissions / totalUsers).toFixed(2) : 0;

    // Status Distribution
    const statusDistribution = await Submission.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    //Credit Statistics
    const creditStats = await User.aggregate([
        {
            $match: { role: { $ne: 'admin' } }
        },
        {
            $group: {
                _id: null,
                totalCredits: { $sum: "$credits" },
                avgCredits: { $avg: "$credits" },
                maxCredits: { $max: "$credits" }
            }
        }
    ]);

    // Top Contributors
    const topContributors = await Submission.aggregate([
        {
            $group: {
                _id: "$user",
                submissionCount: { $sum: 1 },
                totalCredits: { $sum: "$creditsAwarded" }
            }
        },
        {
            $sort: { submissionCount: -1 }
        },
        {
            $limit: 5
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $unwind: '$userInfo'
        },
        {
            $project: {
                name: '$userInfo.name',
                email: '$userInfo.email',
                submissionCount: 1,
                totalCredits: 1
            }
        }
    ]);

    const analytics = {
        timeline: {
            submissions: submissionsTimeline,
            userGrowth: userGrowth
        },
        breakdown: {
            categories: categoryBreakdown,
            status: statusDistribution
        },
        engagement: {
            totalUsers,
            activeUsers: activeUsers.length,
            engagementRate: totalUsers > 0 ? ((activeUsers.length / totalUsers) * 100).toFixed(2) : 0,
            avgSubmissionsPerUser
        },
        credits: creditStats[0] || { totalCredits: 0, avgCredits: 0, maxCredits: 0 },
        topContributors
    };

    res.json({
        success: true,
        data: analytics
    });
});
