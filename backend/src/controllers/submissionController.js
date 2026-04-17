const Submission = require('../models/Submission');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifySubmission } = require('../utils/aiVerification');

// Tolerant JSON parse: accepts already-parsed values, returns fallback on
// invalid input. Several form fields arrive as JSON strings from multipart
// uploads, but malformed payloads were throwing 500s.
const safeJsonParse = (value, fallback) => {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

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
    const { type, weight, location, description, imageHashes, memberCount, wasteType, submissionType, weightKg, participantCount, areaCriticality } = req.body;
    // `type` is the high-level submission category (enum: garbage/water/methane/restoration).
    // `wasteType` is the granular sub-category (organic/general/plastic/...).
    // Validate `type` against the enum so a stray AI-detected wasteType can't bleed into it.
    const SUBMISSION_TYPES = ['garbage', 'water', 'methane', 'restoration'];
    const WASTE_TYPES = ['organic', 'general', 'construction', 'plastic', 'drain', 'hazardous'];
    const SUBMISSION_KINDS = ['individual', 'group', 'community'];
    const safeType = SUBMISSION_TYPES.includes(type) ? type : 'garbage';
    const safeWasteType = WASTE_TYPES.includes(wasteType) ? wasteType : 'general';
    const safeSubmissionType = SUBMISSION_KINDS.includes(submissionType) ? submissionType : 'individual';

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

    const members = (parseInt(memberCount) || parseInt(participantCount) || 0) > 0
      ? (parseInt(memberCount) || parseInt(participantCount))
      : 1;

    const {
      participantIds: rawParticipantIds,
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
      // Members mode: Split credits among tagged users + self.
      // Frontend sends `participantIds`; legacy field `taggedUsers` accepted as fallback.
      const parsedTagged = safeJsonParse(rawParticipantIds, null) ?? safeJsonParse(taggedUsers, []);
      const safeTagged = Array.isArray(parsedTagged) ? parsedTagged.filter(Boolean) : [];
      membersForCredit = safeTagged.length + 1; // Uploader + tagged users
      tags = safeTagged;
    } else if (taggingMode === 'community' || taggingMode === 'ngo') {
      // Community/NGO mode: All credits go to submitter only
      membersForCredit = 1;
      const parsedCommunities = safeJsonParse(taggedCommunities, []);
      tags = Array.isArray(parsedCommunities) ? parsedCommunities : [];
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

    // Generate Ticket ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `TKT-${randomNum}`;

    // Parse the multipart string fields up-front so we never throw on bad input
    // mid-write. `location` is required; reject early with a 400 if it's missing
    // or malformed rather than surfacing a generic 500.
    const parsedHashes = safeJsonParse(imageHashes, []);
    const parsedLocation = safeJsonParse(location, null);
    if (!parsedLocation || typeof parsedLocation !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing location payload',
      });
    }

    // Create submission — always saved as 'pending' requiring admin approval.
    // Credits are NOT awarded now; they will be credited when the admin approves.
    // AI-suggested credits are stored in verificationDetails for admin reference.
    // Effective submission kind: bump to 'group' when there are tagged co-participants
    // so the credit calculator divides the total pool across them.
    const effectiveSubmissionType = (taggingMode === 'members' && membersForCredit > 1 && safeSubmissionType === 'individual')
      ? 'group'
      : safeSubmissionType;

    // Only members-mode tags are real co-participants who should receive credits.
    // Community/NGO tags are organisational pointers, not credit recipients.
    const memberParticipantIds = taggingMode === 'members' ? tags : [];

    const submission = await Submission.create({
      user: req.user.id,
      ticketId,
      type: safeType,
      wasteType: safeWasteType,
      submissionType: effectiveSubmissionType,
      participantCount: membersForCredit,
      participantIds: memberParticipantIds,
      areaCriticality: areaCriticality || 'low',
      photos: cloudinaryUrls.length > 0 ? cloudinaryUrls : photoRelativePaths,
      imageHashes: Array.isArray(parsedHashes) ? parsedHashes : [],
      weight: verification.trashWeight || weightKg || weight || 0.5,
      weightKg: Number(weightKg || weight || verification.trashWeight) || 0.5,
      location: parsedLocation,
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
        tokensEarned: verification.tokensEarned || 0,
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

// @desc    Upload re-verification photo (Phase 2)
// @route   POST /api/submissions/:id/re-verify
// @access  Private
exports.uploadReverification = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check ownership
    if (submission.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Re-verification flow is deprecated — admin approval now grants 100% credits in one step.
    return res.status(410).json({
      success: false,
      message: 'Re-verification is no longer required. Credits are granted in full on admin approval.'
    });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a photo' });
    }

    // Upload to Cloudinary
    const { uploadMultipleToCloudinary } = require('../utils/cloudinary');
    const cloudinaryUrls = await uploadMultipleToCloudinary([req.file.path], 'ecotrace/reverifications');
    
    submission.reverificationPhoto = cloudinaryUrls[0];
    await submission.save();

    res.json({
      success: true,
      message: 'Re-verification photo uploaded successfully. Waiting for final admin approval.',
      data: {
        reverificationPhoto: submission.reverificationPhoto
      }
    });
  } catch (error) {
    console.error('Re-verification upload error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
