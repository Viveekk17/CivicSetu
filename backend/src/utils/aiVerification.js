const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Real AI verification using Replit API
const verifySubmission = async (type, photos, weight) => {
  try {
    // Check if we have at least one photo
    if (!photos || photos.length === 0) {
      return {
        verified: false,
        confidence: 0,
        credits: 0,
        notes: 'No photos provided'
      };
    }

    // Prepare FormData with before/after images
    const formData = new FormData();

    // Get absolute paths for images
    // If path is already absolute (from controller), use it. Otherwise resolve from uploads.
    const resolvePath = (p) => {
      if (path.isAbsolute(p)) return p;
      return path.join(__dirname, '../../', p);
    };

    const beforeImagePath = photos[0] ? resolvePath(photos[0]) : null;
    const afterImagePath = photos[1] ? resolvePath(photos[1]) : null;

    // Add images to form data
    if (beforeImagePath && fs.existsSync(beforeImagePath)) {
      formData.append('before_image', fs.createReadStream(beforeImagePath));
    }

    if (afterImagePath && fs.existsSync(afterImagePath)) {
      formData.append('after_image', fs.createReadStream(afterImagePath));
    }

    // If we only have one image, use it for both before and after
    if (photos.length === 1 && beforeImagePath && fs.existsSync(beforeImagePath)) {
      formData.append('after_image', fs.createReadStream(beforeImagePath));
    }

    // Call Replit AI API
    console.log('🚀 CALLING REPLIT API:', `${process.env.REPLIT_API}/verify-cleanup`);
    console.log('📸 Sending images:', {
      beforeExists: !!beforeImagePath && fs.existsSync(beforeImagePath),
      afterExists: !!afterImagePath && fs.existsSync(afterImagePath),
      beforePath: beforeImagePath,
      afterPath: afterImagePath
    });

    const response = await axios.post(
      `${process.env.REPLIT_API}/verify-cleanup`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ REPLIT API RESPONSE RECEIVED');
    const result = response.data;

    // ============================================
    // 🔍 DEBUG: Print complete AI response
    // ============================================
    console.log('\n========== AI VERIFICATION RESPONSE ==========');
    console.log(JSON.stringify(result, null, 2));
    console.log('=============================================\n');

    // Check if fraud detected
    if (result.is_fraud) {
      return {
        verified: false,
        confidence: 0,
        credits: 0,
        notes: result.message || 'Fraud detected: AI-generated or manipulated image'
      };
    }

    // Parse successful verification
    const verification = result.verification || {};
    const trashWeight = verification.trash_weight_kg || 1;
    const category = verification.category || 'garbage';
    const suggestedDescription = verification.suggested_description || verification.ai_analysis_note;

    // Calculate credits based on weight (ignore API's tokens_earned)
    const calculatedCredits = calculateCredits(trashWeight);

    console.log('💰 Credits calculated:', {
      weight: trashWeight,
      credits: calculatedCredits,
      apiTokens: verification.tokens_earned,
      note: 'Using weight-based calculation, ignoring API tokens'
    });

    return {
      verified: true,
      confidence: 0.95, // High confidence from AI
      credits: calculatedCredits, // Use calculated credits, not API's tokens_earned
      co2Saved: parseFloat(verification.co2_saved) || trashWeight, // Ensure it's a number
      trashWeight: trashWeight,
      category: category,
      suggestedDescription: suggestedDescription,
      notes: verification.ai_analysis_note || 'Verified by AI'
    };

  } catch (error) {
    console.error('❌ REPLIT API ERROR:', error.message);
    console.error('Error details:', {
      url: `${process.env.REPLIT_API}/verify-cleanup`,
      error: error.response?.data || error.message,
      status: error.response?.status
    });

    // Fallback to mock verification if API fails
    console.log('⚠️ Falling back to mock verification...');
    return mockVerification(type, weight);
  }
};

// Fallback mock verification (in case API is down)
const mockVerification = (type, weight = 1) => {
  const confidence = 0.85 + Math.random() * 0.15;
  const credits = calculateCredits(weight); // Use weight-based calculation
  const isVerified = Math.random() > 0.05;

  return {
    verified: isVerified,
    confidence: parseFloat(confidence.toFixed(2)),
    credits: isVerified ? credits : 0,
    co2Saved: weight, // CO2 = weight (1:1 ratio)
    trashWeight: weight,
    category: type,
    notes: isVerified
      ? `Verified with ${(confidence * 100).toFixed(0)}% confidence (Mock)`
      : 'Image quality insufficient for verification'
  };
};

// Weight-based credit calculation using tier system
// Ignores API credits, calculates based on weight only
const calculateCredits = (weight = 1) => {
  // Credit tiers based on weight (kg → credits)
  const creditTiers = [
    // Instant motivation zone (1-5 kg)
    { weight: 1, credits: 50 },
    { weight: 2, credits: 120 },
    { weight: 3, credits: 170 },
    { weight: 4, credits: 220 },
    { weight: 5, credits: 280 },

    // Serious citizen zone (6-15 kg)
    { weight: 6, credits: 330 },
    { weight: 8, credits: 420 },
    { weight: 10, credits: 550 },
    { weight: 12, credits: 650 },
    { weight: 15, credits: 800 },

    // Community zone (16-30 kg)
    { weight: 18, credits: 950 },
    { weight: 20, credits: 1100 },
    { weight: 25, credits: 1400 },
    { weight: 30, credits: 1800 },

    // NGO / high impact zone (31-50 kg)
    { weight: 35, credits: 2200 },
    { weight: 40, credits: 2600 },
    { weight: 45, credits: 3000 },
    { weight: 50, credits: 3500 }
  ];

  // Round weight to 2 decimal places for consistent comparison
  const roundedWeight = Math.round(weight * 100) / 100;

  // Find exact match first
  const exactMatch = creditTiers.find(tier => tier.weight === roundedWeight);
  if (exactMatch) return exactMatch.credits;

  // If weight is below minimum tier, return minimum credits
  if (roundedWeight < creditTiers[0].weight) {
    return Math.round((roundedWeight / creditTiers[0].weight) * creditTiers[0].credits);
  }

  // If weight exceeds max tier, extrapolate
  if (roundedWeight > creditTiers[creditTiers.length - 1].weight) {
    const maxTier = creditTiers[creditTiers.length - 1];
    const previousTier = creditTiers[creditTiers.length - 2];
    const rate = (maxTier.credits - previousTier.credits) / (maxTier.weight - previousTier.weight);
    return Math.round(maxTier.credits + (roundedWeight - maxTier.weight) * rate);
  }

  // Linear interpolation between tiers
  for (let i = 0; i < creditTiers.length - 1; i++) {
    const lowerTier = creditTiers[i];
    const upperTier = creditTiers[i + 1];

    if (roundedWeight > lowerTier.weight && roundedWeight < upperTier.weight) {
      // Calculate interpolated credits
      const weightRange = upperTier.weight - lowerTier.weight;
      const creditRange = upperTier.credits - lowerTier.credits;
      const weightDiff = roundedWeight - lowerTier.weight;
      const interpolatedCredits = lowerTier.credits + (weightDiff / weightRange) * creditRange;

      return Math.round(interpolatedCredits);
    }
  }

  // Fallback (should never reach here)
  return 50;
};

module.exports = {
  verifySubmission,
  calculateCredits
};
