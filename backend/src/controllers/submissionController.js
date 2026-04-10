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
    const localPhotoPaths = req.files.map(file => file.path); // Get absolute paths for AI

    // Run AI verification (but don't save to database)
    const verification = await verifySubmission(type, localPhotoPaths, weight || 1);

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

      try {
        console.log(`🚀 Attempting to upload ${localPhotoPaths.length} photos to Cloudinary...`);

        // Upload to Cloudinary and delete local files
        cloudinaryUrls = await uploadMultipleToCloudinary(localPhotoPaths, 'ecotrace/submissions');

        console.log(`✅ Successfully uploaded ${cloudinaryUrls.length} photos to Cloudinary`);
        console.log('Cloudinary URLs:', cloudinaryUrls);
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
        console.error('Full error:', cloudinaryError);

        // Fallback: Use local paths instead of failing completely
        console.log('⚠️  Falling back to local file paths');
        cloudinaryUrls = photoRelativePaths;
      }
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

    const {
      // type, // Already declared above
      // weight, // Already declared above
      // location, // Already declared above
      // description, // Already declared above
      // memberCount, // Already declared above
      taggedUsers,
      taggingMode,
      taggedCommunities
    } = req.body;

    console.log('📥 Received submission data:', { type, weight, taggingMode, memberCount });

    // New tagging mode validation
    if (weight > 50 && taggingMode !== 'ngo') {
      return res.status(400).json({
        success: false,
        message: 'Cleanups over 50 kg require NGO tagging mode.',
        requiresNGO: true,
        weight: weight
      });
    }

    // Strict validation for > 20kg (Community or NGO required)
    if (weight > 20 && (!taggingMode || taggingMode === 'members')) {
      return res.status(400).json({
        success: false,
        message: 'Cleanups over 20 kg require Community or NGO tagging.',
        requiresCommunityOrNGO: true,
        weight: weight
      });
    }

    // Process credits based on tagging mode
    let totalPool = verification.credits || 0;
    let membersForCredit = 1; // Default for community/NGO mode
    let finalCreditsPerPerson = totalPool;
    let tags = []; // This will store the IDs of tagged users or communities

    // Mode-specific credit caps
    const creditCaps = {
      ngo: 650,
      community: 750,
      members: 1000
    };

    const capPerPerson = creditCaps[taggingMode] || 1000;

    if (taggingMode === 'members') {
      // Members mode: Split credits among tagged users + self
      const parsedTaggedUsers = taggedUsers ? JSON.parse(taggedUsers) : [];
      membersForCredit = parsedTaggedUsers.length + 1; // Uploader + tagged users
      tags = parsedTaggedUsers;
    } else if (taggingMode === 'community' || taggingMode === 'ngo') {
      // Community/NGO mode: All credits go to submitter only
      membersForCredit = 1;
      const parsedCommunities = taggedCommunities ? JSON.parse(taggedCommunities) : [];
      tags = parsedCommunities;
    }

    // Apply mode-specific cap
    totalPool = Math.min(totalPool, capPerPerson * membersForCredit);
    finalCreditsPerPerson = Math.ceil(totalPool / membersForCredit);

    console.log('💰 Credit Calculation:', {
      mode: taggingMode,
      rawCredits: verification.credits,
      cappedPool: totalPool,
      members: membersForCredit,
      perPerson: finalCreditsPerPerson,
      cap: capPerPerson
    });

    // Create submission — always saved as 'pending' requiring admin approval.
    // Credits are NOT awarded now; they will be credited when the admin approves.
    // AI-suggested credits are stored in verificationDetails for admin reference.
    const submission = await Submission.create({
      user: req.user.id,
      type: verification.category || type,
      photos: cloudinaryUrls.length > 0 ? cloudinaryUrls : photoRelativePaths,
      imageHashes: imageHashes ? JSON.parse(imageHashes) : [],
      weight: verification.weight || weight || 1,
      location: JSON.parse(location),
      description,
      status: 'pending',           // Always pending — admin must review
      creditsAwarded: 0,            // No credits until admin approves
      verificationDetails: {
        verifiedAt: null,           // Will be set when admin approves
        verifiedBy: 'Pending Admin Review',
        confidence: verification.confidence,
        notes: verification.notes,
        co2Saved: verification.co2Saved,
        trashWeight: verification.trashWeight,
        category: verification.category,
        suggestedDescription: verification.suggestedDescription,
        suggestedCredits: finalCreditsPerPerson, // AI suggestion for admin
        memberCount: membersForCredit,
        totalPool: Math.ceil(totalPool),
        taggingMode: taggingMode || 'members',
        taggedUsers: taggingMode === 'members' ? tags : [],
        taggedCommunities: (taggingMode === 'community' || taggingMode === 'ngo') ? tags : []
      }
    });

    console.log(`💾 Submission saved as PENDING (awaiting admin review) with ${cloudinaryUrls.length > 0 ? 'Cloudinary' : 'local'} URLs:`, submission.photos);
    console.log(`ℹ️  AI suggested ${finalCreditsPerPerson} credits — will be awarded upon admin approval.`);

    // ── SEND EMAIL NOTIFICATION (ASYNC) ──
    const { sendSubmissionEmail } = require('../utils/mailService');
    const userToNotify = await User.findById(req.user.id);
    if (userToNotify && userToNotify.email) {
      // Fire and forget, don't wait for email to respond to client
      sendSubmissionEmail(userToNotify, submission).catch(err => {
        console.error('📧 Email background error:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Submission received and sent to authorities for review. Credits will be credited upon approval.',
      data: submission,
      creditsAwarded: finalCreditsPerPerson // Inform front-end of AI estimate (not yet awarded)
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
