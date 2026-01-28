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

// @desc    Check for duplicate images
// @route   POST /api/submissions/check-duplicate
// @access  Private
exports.checkDuplicate = async (req, res) => {
  try {
    const { hashes } = req.body;

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide image hashes'
      });
    }

    // Check if ANY of the hashes exist in ANY submission's imageHashes array
    const duplicate = await Submission.findOne({
      imageHashes: { $in: hashes }
    });

    if (duplicate) {
      return res.json({
        success: true,
        exists: true,
        message: 'Duplicate image detected. This photo has already been processed.'
      });
    }

    res.json({
      success: true,
      exists: false,
      message: 'No duplicates found'
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking for duplicates',
      error: error.message
    });
  }
};


// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
exports.createSubmission = async (req, res) => {
  try {
    const { type, weight, location, description, imageHashes, memberCount } = req.body;

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one photo'
      });
    }

    // Get local photo paths (uploaded to uploads/ folder)
    const localPhotoPaths = req.files.map(file => file.path);
    const photoRelativePaths = req.files.map(file => `/uploads/${file.filename}`);

    // DEBUG: Check what we received
    console.log('📝 Submission Request Received');
    console.log('Body Keys:', Object.keys(req.body));
    console.log('Member Count:', memberCount);

    // AI verification using local files
    // Use localPhotoPaths (which comes from multer's file.path) to ensure correct path resolution

    let verification;

    // Check if we have pre-verified data (passed as JSON string)
    if (req.body.verificationData) {
      try {
        console.log('Using pre-verified data from client');
        verification = JSON.parse(req.body.verificationData);

        // Ensure verified is boolean
        verification.verified = verification.verified === true || verification.verified === 'true';
      } catch (e) {
        console.error('Failed to parse verificationData', e);
        // Fallback to server-side verification
        verification = await verifySubmission(type, localPhotoPaths, weight || 1);
      }
    } else {
      console.log('Running server-side verification');
      verification = await verifySubmission(type, localPhotoPaths, weight || 1);
    }

    // Only upload to Cloudinary if verification is successful
    let cloudinaryUrls = [];
    if (verification.verified) {
      const { uploadMultipleToCloudinary } = require('../utils/cloudinary');

      // Upload to Cloudinary and delete local files
      cloudinaryUrls = await uploadMultipleToCloudinary(localPhotoPaths, 'ecotrace/submissions');
      console.log(`✅ Uploaded ${cloudinaryUrls.length} photos to Cloudinary`);
    } else {
      // If rejected, still delete local files
      const fs = require('fs').promises;
      for (const filePath of localPhotoPaths) {
        try {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted rejected photo: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete ${filePath}:`, err);
        }
      }
    }

    // Calculate Credits with Group Bonus (Split Logic)
    // Base Credits from AI
    // Bonus: 10% of Base per extra member
    // Total Pool = Base * (1 + (Members - 1) * 0.1)
    // Per Person = Total Pool / Members

    const members = (parseInt(memberCount) || 0) > 0 ? parseInt(memberCount) : 1;
    // memberCount from req.body usually comes from the form.
    // However, if taggedUsers was sent, meaningful count should be taggedUsers.length + 1
    // Front end sends `memberCount` as `taggedUsers.length + 1` correctly.

    const baseCredits = verification.credits || 0;

    // Calculate Bonus Pool
    // Example: 100 Base. 5 Members.
    // Bonus Muliplier = 1 + (4 * 0.1) = 1.4
    // Total Pool = 140.
    // Per Person = 140 / 5 = 28.

    let totalPool = baseCredits;
    if (members > 1) {
      totalPool = baseCredits * (1 + (members - 1) * 0.1);
    }

    const finalCreditsPerPerson = Math.ceil(totalPool / members);

    // Create submission with Cloudinary URLs (or empty array if rejected)
    const submission = await Submission.create({
      user: req.user.id,
      type: verification.category || type, // Use AI-detected category
      photos: cloudinaryUrls.length > 0 ? cloudinaryUrls : [],
      imageHashes: imageHashes ? JSON.parse(imageHashes) : [], // Expecting JSON array string if sent via FormData
      weight: verification.weight || weight || 1, // Use verified weight if available
      location: JSON.parse(location),
      description,
      status: verification.verified ? 'verified' : 'rejected',
      creditsAwarded: finalCreditsPerPerson,
      verificationDetails: {
        verifiedAt: new Date(),
        verrifiedBy: 'AI',
        confidence: verification.confidence,
        notes: verification.notes,
        co2Saved: verification.co2Saved,
        trashWeight: verification.trashWeight,
        category: verification.category,
        suggestedDescription: verification.suggestedDescription,
        memberCount: members,
        totalPool: Math.ceil(totalPool)
      }
    });

    // If verified, award credits to user (Primary Uploader)
    if (verification.verified) {
      // 1. Award to Uploader
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { credits: finalCreditsPerPerson }
      });

      await Transaction.create({
        user: req.user.id,
        type: 'earned',
        amount: finalCreditsPerPerson,
        description: `Credits earned from ${type} submission (${members} members)`,
        metadata: { submissionId: submission._id }
      });

      // 2. Award to Tagged Users
      if (req.body.taggedUsers) {
        try {
          const taggedIds = JSON.parse(req.body.taggedUsers);
          if (Array.isArray(taggedIds) && taggedIds.length > 0) {
            console.log(`Distributing credits to ${taggedIds.length} tagged users...`);

            for (const userId of taggedIds) {
              // Skip if self (shouldn't happen due to frontend filter but safety first)
              if (userId === req.user.id) continue;

              await User.findByIdAndUpdate(userId, {
                $inc: { credits: finalCreditsPerPerson }
              });

              await Transaction.create({
                user: userId,
                type: 'earned',
                amount: finalCreditsPerPerson,
                description: `Credits earned from ${type} submission (Shared Activity)`,
                metadata: {
                  submissionId: submission._id,
                  sharedBy: req.user.id
                }
              });
            }
          }
        } catch (err) {
          console.error('Error distributing credits to tagged users:', err);
          // Don't fail the whole request, just log it
        }
      }
    }


    res.status(201).json({
      success: true,
      message: verification.verified
        ? 'Submission verified and uploaded to cloud storage'
        : 'Submission rejected by AI verification',
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
