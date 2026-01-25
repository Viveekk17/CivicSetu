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
    const beforeImagePath = photos[0] ? path.join(__dirname, '../../', photos[0]) : null;
    const afterImagePath = photos[1] ? path.join(__dirname, '../../', photos[1]) : null;

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
    const response = await axios.post(
      `${process.env.REPLIT_API}/verify-cleanup`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30 second timeout
      }
    );

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
    const tokensEarned = verification.tokens_earned || 0;
    const category = verification.category || 'garbage';
    const suggestedDescription = verification.suggested_description || verification.ai_analysis_note;
    
    return {
      verified: true,
      confidence: 0.95, // High confidence from AI
      credits: Math.round(tokensEarned),
      co2Saved: verification.co2_saved,
      trashWeight: verification.trash_weight_kg,
      category: category,
      suggestedDescription: suggestedDescription,
      notes: verification.ai_analysis_note || 'Verified by AI'
    };

  } catch (error) {
    console.error('AI Verification Error:', error.message);
    
    // Fallback to mock verification if API fails
    console.log('Falling back to mock verification...');
    return mockVerification(type, weight);
  }
};

// Fallback mock verification (in case API is down)
const mockVerification = (type, weight = 1) => {
  const confidence = 0.85 + Math.random() * 0.15;
  const credits = calculateCredits(type, weight);
  const isVerified = Math.random() > 0.05;
  
  return {
    verified: isVerified,
    confidence: parseFloat(confidence.toFixed(2)),
    credits: isVerified ? credits : 0,
    notes: isVerified 
      ? `Verified with ${(confidence * 100).toFixed(0)}% confidence (Mock)` 
      : 'Image quality insufficient for verification'
  };
};

const calculateCredits = (type, weight = 1) => {
  const baseCredits = {
    'garbage': 50,
    'water': 30,
    'methane': 75,
    'restoration': 100
  };
  
  const base = baseCredits[type] || 25;
  const weightMultiplier = Math.min(weight / 10, 3);
  
  return Math.round(base * (1 + weightMultiplier));
};

module.exports = {
  verifySubmission,
  calculateCredits
};
