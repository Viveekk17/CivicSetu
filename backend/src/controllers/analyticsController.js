const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId);

    // Get stats
    const totalSubmissions = await Submission.countDocuments({ user: userId });
    const verifiedSubmissions = await Submission.countDocuments({
      user: userId,
      status: 'verified'
    });

    // Get total credits earned and redeemed
    const creditsEarned = await Transaction.aggregate([
      { $match: { user: user._id, type: 'earned' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const creditsRedeemed = await Transaction.aggregate([
      { $match: { user: user._id, type: 'redeemed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Use NEW impact fields from User model
    const pollutionSaved = user.impact?.pollutionSaved || 0;
    const treesPlanted = user.impact?.treesPlanted || 0;

    // Calculate CO2 saved from pollution (1kg waste = 0.5kg CO2)
    const co2FromWaste = pollutionSaved * 0.5;
    // Each tree absorbs ~20kg CO2/year
    const co2FromTrees = treesPlanted * 20;
    const totalCo2Saved = Math.round(co2FromWaste + co2FromTrees);

    // Recent activity - Get all transactions
    const recentActivity = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('type amount description createdAt');

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role
        },
        stats: {
          totalSubmissions,
          verifiedSubmissions,
          pendingSubmissions: totalSubmissions - verifiedSubmissions,
          totalCreditsEarned: creditsEarned[0]?.total || 0,
          totalCreditsRedeemed: creditsRedeemed[0]?.total || 0,
          currentBalance: user.credits,
          impact: {
            co2Saved: totalCo2Saved,
            trees: treesPlanted, // Dashboard expects 'trees' not 'treesPlanted'
            waste: pollutionSaved // Dashboard expects 'waste' (pollution saved in kg)
          }
        },
        recentActivity
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

// @desc    Get global leaderboard
// @route   GET /api/analytics/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sortBy = 'pollutionSaved', limit = 10 } = req.query;

    // Determine sort field
    const sortField = sortBy === 'trees'
      ? 'impact.treesPlanted'
      : 'impact.pollutionSaved';

    // Get top users sorted by environmental impact
    let topUsers = await User.find()
      .select('name email impact')
      .sort({ [sortField]: -1, 'impact.treesPlanted': -1 }) // Secondary sort by trees
      .limit(parseInt(limit))
      .lean();

    // Add rank property and ensure impact field exists
    topUsers = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
      impact: user.impact || { pollutionSaved: 0, treesPlanted: 0 }
    }));

    // If authenticated user is not in top 10, find their rank and add them
    if (userId) {
      const userInTop10 = topUsers.find(u => u._id.toString() === userId);

      if (!userInTop10) {
        const currentUser = await User.findById(userId).select('name email impact').lean();

        if (currentUser) {
          // Calculate rank: count users with higher impact
          const currentImpact = currentUser.impact?.pollutionSaved || 0;
          const higherRankCount = await User.countDocuments({
            'impact.pollutionSaved': { $gt: currentImpact }
          });

          const rank = higherRankCount + 1;

          topUsers.push({
            ...currentUser,
            rank: rank,
            impact: currentUser.impact || { pollutionSaved: 0, treesPlanted: 0 }
          });
        }
      }
    }

    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get mock AQI data
// @route   GET /api/analytics/aqi
// @access  Public
exports.getAQI = async (req, res) => {
  try {
    // Mock AQI data - in production, call external API
    const mockData = {
      location: 'New York, USA',
      aqi: Math.floor(Math.random() * 100) + 20, // 20-120
      status: 'Good',
      pollutants: {
        pm25: Math.floor(Math.random() * 30) + 5,
        pm10: Math.floor(Math.random() * 50) + 10,
        o3: Math.floor(Math.random() * 60) + 20
      },
      lastUpdated: new Date()
    };

    // Determine status based on AQI
    if (mockData.aqi <= 50) mockData.status = 'Good';
    else if (mockData.aqi <= 100) mockData.status = 'Moderate';
    else if (mockData.aqi <= 150) mockData.status = 'Unhealthy for Sensitive Groups';
    else mockData.status = 'Unhealthy';

    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get detailed analytics for analytics page
// @route   GET /api/analytics/detailed?period=24h|7days|1month|1year
// @access  Private
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const period = req.query.period || '1year';

    // Get all submissions
    const allSubmissions = await Submission.find({ user: userId });
    const totalSubmissions = allSubmissions.length;
    const verifiedSubmissions = allSubmissions.filter(s => s.status === 'verified').length;
    const pendingSubmissions = allSubmissions.filter(s => s.status === 'pending').length;
    const rejectedSubmissions = allSubmissions.filter(s => s.status === 'rejected').length;

    // Calculate verification rate
    const verificationRate = totalSubmissions > 0
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100)
      : 0;

    // Get credits data
    const creditsEarned = await Transaction.aggregate([
      { $match: { user: user._id, type: 'earned' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const creditsRedeemed = await Transaction.aggregate([
      { $match: { user: user._id, type: 'redeemed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Determine time range and grouping based on period
    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          hour: { $hour: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        };
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        };
        break;
      case '1month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        };
        break;
      case '1year':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        groupBy = {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        };
        break;
    }

    // Get credits trend based on period
    const creditsTrend = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: startDate },
          type: 'earned'
        }
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Get monthly activity - all time
    console.log('Fetching monthly activity for user:', userId);
    const monthlyActivity = await Submission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('Monthly Activity Result:', monthlyActivity);
    console.log('Monthly Activity Count:', monthlyActivity.length);

    // Calculate environmental impact
    const totalWeight = allSubmissions.reduce((sum, s) => sum + (s.weight || 0), 0);
    const co2Saved = Math.round(totalWeight * 0.5); // 1kg waste = 0.5kg CO2 saved (approximate)
    const treesEquivalent = Math.round(co2Saved / 20); // 1 tree absorbs ~20kg CO2/year
    const wasteCollected = Math.round(totalWeight);

    res.json({
      success: true,
      data: {
        stats: {
          totalSubmissions,
          verifiedSubmissions,
          pendingSubmissions,
          rejectedSubmissions,
          verificationRate,
          totalCreditsEarned: creditsEarned[0]?.total || 0,
          totalCreditsRedeemed: creditsRedeemed[0]?.total || 0,
          currentBalance: user.credits
        },
        creditsTrend,
        period,
        monthlyActivity,
        environmentalImpact: {
          co2Saved,
          treesEquivalent,
          wasteCollected
        },
        submissionsByStatus: {
          verified: verifiedSubmissions,
          pending: pendingSubmissions,
          rejected: rejectedSubmissions
        }
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

// @desc    Get submissions breakdown by category
// @route   GET /api/analytics/categories
// @access  Private
exports.getSubmissionsByCategory = async (req, res) => {
  try {
    const userId = req.user.id;

    const categoryBreakdown = await Submission.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditsAwarded' },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          }
        }
      }
    ]);

    // Calculate percentages
    const total = categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);
    const categoriesWithPercentage = categoryBreakdown.map(cat => ({
      type: cat._id,
      count: cat.count,
      totalCredits: cat.totalCredits,
      verified: cat.verified,
      percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0
    }));

    res.json({
      success: true,
      data: categoriesWithPercentage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get progress timeline
// @route   GET /api/analytics/timeline
// @access  Private
exports.getProgressTimeline = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const timeline = await Submission.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          submissions: { $sum: 1 },
          creditsEarned: { $sum: '$creditsAwarded' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get global platform impact statistics
// @route   GET /api/analytics/global-impact
// @access  Public
exports.getGlobalImpactStats = async (req, res) => {
  try {
    // 1. Civic Actions Logged (Total Submissions)
    const totalSubmissions = await Submission.countDocuments();
    
    // 2. Active Citizens (Total users excluding admins)
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    
    // 3. Global Trees Planted (Sum of all treesPlanted from User model)
    const impactStats = await User.aggregate([
      { $group: { _id: null, totalTrees: { $sum: "$impact.treesPlanted" } } }
    ]);
    const totalTreesPlanted = impactStats[0]?.totalTrees || 0;

    // 4. Credits Redeemed (Sum of all 'redeemed' transactions)
    const creditStats = await Transaction.aggregate([
      { $match: { type: 'redeemed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCreditsRedeemed = creditStats[0]?.total || 0;

    res.json({
      success: true,
      data: {
        civicActions: totalSubmissions,
        activeCitizens: totalUsers,
        treesPlanted: totalTreesPlanted,
        creditsRedeemed: totalCreditsRedeemed
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
