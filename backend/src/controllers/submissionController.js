const Submission = require('../models/Submission');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifySubmission } = require('../utils/aiVerification');

// @desc    Analyze photos with AI (preview only, don't save)
// @route   POST /api/submissions/analyze
// @access  Private
exports.analyzePhotos = async (req, res) => {
  try {
    const { type, weight, location } = req.body;

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one photo'
      });
    }

    // Get photo paths
    const photos = req.files.map(file => `/uploads/${file.filename}`);

    // Run AI verification (but don't save to database)
    const verification = await verifySubmission(type, photos, weight || 1);

    // Return AI analysis without saving
    res.json({
      success: true,
      message: 'AI analysis complete',
      data: {
        verification: verification,
        photos: photos
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
};

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
exports.createSubmission = async (req, res) => {
  try {
    const { type, weight, location, description } = req.body;

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one photo'
      });
    }

    // Get photo paths
    const photos = req.files.map(file => `/uploads/${file.filename}`);

    // Create submission
    const submission = await Submission.create({
      user: req.user.id,
      type,
      photos,
      weight: weight || 1,
      location: JSON.parse(location),
      description,
      status: 'pending'
    });

    // AI verification using Replit API
    const verification = await verifySubmission(type, photos, weight || 1);

    // Update submission with verification results
    submission.status = verification.verified ? 'verified' : 'rejected';
    submission.creditsAwarded = verification.credits;
    submission.type = verification.category || type; // Use AI-detected category
    submission.verificationDetails = {
      verifiedAt: new Date(),
      verifiedBy: 'AI',
      confidence: verification.confidence,
      notes: verification.notes,
      co2Saved: verification.co2Saved,
      trashWeight: verification.trashWeight,
      category: verification.category,
      suggestedDescription: verification.suggestedDescription
    };

    await submission.save();

    // If verified, award credits to user
    if (verification.verified) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { credits: verification.credits }
      });

      // Create transaction record
      await Transaction.create({
        user: req.user.id,
        type: 'earned',
        amount: verification.credits,
        description: `Credits earned from ${type} submission`,
        metadata: {
          submissionId: submission._id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Submission created and verified successfully',
      data: submission
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's submissions
// @route   GET /api/submissions
// @access  Private
exports.getSubmissions = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
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

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this submission'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this submission'
      });
    }

    await submission.deleteOne();

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
