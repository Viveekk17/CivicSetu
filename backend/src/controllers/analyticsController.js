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
          currentBalance: user.credits
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
    const topUsers = await User.find()
      .select('name credits')
      .sort({ credits: -1 })
      .limit(10);

    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
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
