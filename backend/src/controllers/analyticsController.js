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

    // Calculate Real Impact Data
    // 1. Waste Cleaned: Sum of weight from verified submissions
    const wasteStats = await Submission.aggregate([
      { $match: { user: user._id, status: 'verified' } },
      { $group: { _id: null, totalWeight: { $sum: '$weight' } } }
    ]);
    const wasteCollected = wasteStats[0]?.totalWeight || 0;

    // 2. Trees Planted: Count of redeemed transactions linked to trees
    // We fetch transactions to get both count and potentially impact from specific tree types
    const treeTransactions = await Transaction.find({ 
      user: userId, 
      type: 'redeemed',
      'metadata.treeId': { $exists: true } 
    }).populate('metadata.treeId');

    const treesPlanted = treeTransactions.length;

    // 3. CO2 Saved: Mixed calculation
    // From Waste: 1kg waste ≈ 0.5kg CO2
    const co2FromWaste = wasteCollected * 0.5;
    
    // From Trees: Sum of specific tree impacts (or default estimate if not available)
    const co2FromTrees = treeTransactions.reduce((sum, tx) => {
      const treeImpact = tx.metadata.treeId?.impact?.co2Offset || 20; // Default 20kg if no specific data
      return sum + treeImpact;
    }, 0);

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
            trees: treesPlanted,
            waste: wasteCollected
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

    // Get top 10 users using lean() for better performance and modifiability
    let topUsers = await User.find()
      .select('name credits')
      .sort({ credits: -1 })
      .limit(10)
      .lean();

    // Add rank property to top users
    topUsers = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // If authenticated user is not in top 10, find their rank and add them
    if (userId) {
      const userInTop10 = topUsers.find(u => u._id.toString() === userId);
      
      if (!userInTop10) {
        const currentUser = await User.findById(userId).select('name credits').lean();
        
        if (currentUser) {
          // Calculate rank: count users with more credits
          const higherRankCount = await User.countDocuments({ 
            credits: { $gt: currentUser.credits } 
          });
          
          const rank = higherRankCount + 1;
          
          topUsers.push({
            ...currentUser,
            rank: rank
          });
        }
      }
    }

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

