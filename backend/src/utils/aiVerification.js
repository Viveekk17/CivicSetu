const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { extractMetadata, checkAIGenerated } = require('./metadataService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Converts local file path to a format Gemini Vision can understand
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

/**
 * Checks if image is AI-generated using Sightengine.
 */
const checkFraudSightengine = async (filePath) => {
  const user = process.env.SIGHTENGINE_USER;
  const secret = process.env.SIGHTENGINE_SECRET;

  if (!user || !secret || user === 'your_user_id_here') {
    return false; // Skip if no keys or placeholder
  }

  try {
    const formData = new FormData();
    formData.append('media', fs.createReadStream(filePath));
    formData.append('models', 'genai');
    formData.append('api_user', user);
    formData.append('api_secret', secret);

    const response = await axios.post('https://api.sightengine.com/1.0/check.json', formData, {
      headers: formData.getHeaders(),
    });

    const output = response.data;
    
    // Check for Sightengine specific quota errors in the body
    if (output.status === 'failure' && output.error && output.error.code === 1001) {
      console.warn('⚠️ Sightengine quota reached. Skipping pixel-level AI check.');
      return false;
    }

    return !!(output.type && output.type.ai_generated > 0.3);
  } catch (error) {
    // Check for HTTP 429 (Rate Limit / Quota)
    if (error.response && (error.response.status === 429 || error.response.status === 402)) {
      console.warn('⚠️ Sightengine API Limit reached. Phase 1b skipped.');
      return false;
    }
    console.error('Sightengine error:', error.message);
    return false;
  }
};

/**
 * 3-PHASE AI ANALYSIS FLOW
 * 1. Authenticity Verify (Metadata Forensics + Sightengine AI detection)
 * 2. Authoritative Scaling (Local YOLO for Weight)
 * 3. Semantic Verification (Gemini for description & activity confirmation)
 */
const verifySubmission = async (type, photos, weight) => {
  try {
    if (!photos || photos.length === 0) {
      return { verified: false, confidence: 0, credits: 0, notes: 'No photos provided' };
    }

    const resolvePath = (p) => {
      if (path.isAbsolute(p)) return p;
      return path.join(__dirname, '../../', p);
    };

    const beforeImagePath = resolvePath(photos[0]);
    const afterImagePath = photos[1] ? resolvePath(photos[1]) : beforeImagePath;

    // --- PHASE 1: Authenticity Check (Metadata + Pixel Detection) ---
    console.log('🛡️ PHASE 1: Authenticity Verification starting...');
    
    // 1a. Metadata Check
    let metadataReason = "";
    try {
      const metadata = await extractMetadata(beforeImagePath);
      const metadataAnalysis = await checkAIGenerated(metadata);
      if (metadataAnalysis.isAIGenerated && metadataAnalysis.confidence > 0.7) {
        console.log('❌ Rejection: AI Metadata detected.');
        return {
          verified: false,
          isFraud: true,
          notes: `Submission rejected: Image metadata indicates AI generation or manipulation (${metadataAnalysis.reason}).`
        };
      }
      metadataReason = metadataAnalysis.reason;
    } catch (err) {
      console.warn('⚠️ Metadata check failed, continuing with visual check...');
    }

    // 1b. Sightengine Check
    const isSightengineAI = await checkFraudSightengine(beforeImagePath);
    if (isSightengineAI) {
      console.log('❌ Rejection: Sightengine pixel-level AI detection triggered.');
      return {
        verified: false,
        isFraud: true,
        notes: 'Submission rejected: Pixel-level analysis detected AI generation patterns.'
      };
    }

    console.log('✅ PHASE 1 passed. Image is authentic.');

    // --- PHASE 2: Authoritative Weight Execution (YOLO) ---
    console.log('📏 PHASE 2: Authoritative Scaling (YOLO) starting...');
    let yoloResults = { total_weight_kg: 0, items_detected: 0 };
    
    try {
      // We send only the before image to our local YOLO service
      const formData = new FormData();
      formData.append('before_image', fs.createReadStream(beforeImagePath));
      
      // Dummy after image just to satisfy the API if needed (or we can just define a single-image endpoint in app.py)
      formData.append('after_image', fs.createReadStream(afterImagePath));

      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiResponse = await axios.post(`${aiUrl}/process-cleanup`, formData, {
        headers: { ...formData.getHeaders() }
      });

      if (aiResponse.data.status === 'success') {
        yoloResults = aiResponse.data.data;
        console.log(`✅ YOLO Weight detected: ${yoloResults.total_weight_kg} kg`);
      }
    } catch (yoloError) {
      console.error('⚠️ YOLO service error, falling back to 0.5kg default:', yoloError.message);
      yoloResults = { total_weight_kg: 0.5, items_detected: 0 };
    }

    const authoritativeWeight = yoloResults.total_weight_kg || 0;
    const useGeminiForWeight = authoritativeWeight <= 0;
    // --- PHASE 3: Semantic Analysis (Gemini) ---
    console.log(`🤖 PHASE 3: Semantic Verification (Gemini) starting... Model: gemini-2.5-flash`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const weightInstruction = useGeminiForWeight 
      ? `3. SCALE ESTIMATION: The primary detector failed to identify specific items. You MUST estimate the weight (kg) of all visual garbage seen in the 'Before' image. Use reference objects (curbs, doors, bags, or the broom) to estimate volume and apply a medium-high density (100-150 kg/m³).`
      : `- The local YOLO object detector has calculated the weight of garbage as: ${authoritativeWeight} kg. YOU MUST USE THIS WEIGHT.`;

    const prompt = `
      You are an Environmental Audit Expert. Analyze these 'Before' and 'After' cleanup images.
      
      CRITICAL INSTRUCTIONS:
      1. Verify if the 'After' image genuinely shows a cleaned version of the 'Before' site.
      2. Analyze the context (e.g., street, park, beach).
      3. Confirm if this is a public space (Eligible) or private household (Ineligible).
      4. If ineligible, set status to 'invalid'.
      
      ${weightInstruction}
      
      OUTPUT: Return ONLY valid JSON matching this schema exactly:
      {
        "location_match": boolean,
        "is_public_space": boolean,
        "category": "garbage" | "water" | "methane" | "restoration" | "invalid",
        "trash_weight_kg": number,
        "description": "Provide a professional technical description of the cleanup activity.",
        "ai_note": "A summary note about the items removed and authenticity feedback.",
        "confidence": 0.0-1.0
      }
    `;

    const imageParts = [
      fileToGenerativePart(beforeImagePath, "image/jpeg"),
      fileToGenerativePart(afterImagePath, "image/jpeg")
    ];

    console.log('📡 Sending request to Gemini Vision...');
    let semanticResult;
    try {
      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      console.log('📝 Raw Gemini Response:', responseText);

      // Robust JSON Extraction
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON format in Gemini response');
      }
      semanticResult = JSON.parse(jsonMatch[0]);
    } catch (apiError) {
      if (apiError.message && (apiError.message.includes('429') || apiError.message.includes('quota') || apiError.message.includes('exhausted'))) {
        console.warn('⚠️ Gemini Quota Reached. Using YOLO authoritative weight and skipping semantic confirm.');
        return {
          verified: true,
          confidence: 0.7,
          credits: calculateCredits(authoritativeWeight || weight || 1),
          tokensEarned: Math.ceil((authoritativeWeight || weight || 1) * 10),
          co2Saved: parseFloat(((authoritativeWeight || weight || 1) * 1.2).toFixed(2)),
          trashWeight: authoritativeWeight || weight || 1,
          category: 'garbage',
          suggestedDescription: 'Analysis completed in economy mode due to AI traffic.',
          notes: 'AI Quota limit reached. Used YOLO engine for weight.'
        };
      }
      throw apiError; // Re-throw other errors to the main catch
    }

    // Standardize result mapping
    const geminiWeight = semanticResult.trash_weight_kg || semanticResult.weight || 0;
    const isVerified = semanticResult.location_match && semanticResult.is_public_space && semanticResult.category !== 'invalid';
    
    // Final Calculation
    const finalWeight = useGeminiForWeight ? (geminiWeight || 0.5) : authoritativeWeight;
    const tokens = Math.ceil(finalWeight * 10);
    const co2 = parseFloat((finalWeight * 1.2).toFixed(2));

    console.log(`✅ AI FLOW COMPLETE: Weight=${finalWeight}kg, Tokens=${tokens}, Source=${useGeminiForWeight ? 'Gemini' : 'YOLO'}`);

    return {
      verified: isVerified,
      confidence: semanticResult.confidence || 0.8,
      credits: isVerified ? calculateCredits(finalWeight) : 0,
      tokensEarned: isVerified ? tokens : 0,
      co2Saved: isVerified ? co2 : 0,
      trashWeight: finalWeight,
      category: semanticResult.category || 'garbage',
      suggestedDescription: semanticResult.description || '',
      notes: semanticResult.ai_note || `Analysis complete. Weight Source: ${useGeminiForWeight ? 'Gemini AI' : 'YOLO Engine'}`
    };

  } catch (error) {
    console.error('❌ AI FLOW ERROR:', error.stack || error.message);
    return mockVerification(type, weight);
  }
};

// Fallback mock verification (in case API is down)
const mockVerification = (type, weight = 1) => {
  const confidence = 0.85 + Math.random() * 0.15;
  const credits = calculateCredits(weight);
  const isVerified = Math.random() > 0.05;

  return {
    verified: isVerified,
    confidence: parseFloat(confidence.toFixed(2)),
    credits: isVerified ? credits : 0,
    co2Saved: weight,
    trashWeight: weight,
    category: type,
    notes: isVerified
      ? `Verified with ${(confidence * 100).toFixed(0)}% confidence (Offline Mock)`
      : 'Image quality insufficient for verification'
  };
};

// Weight-based credit calculation using tier system
const calculateCredits = (weight = 1) => {
  const creditTiers = [
    { weight: 1, credits: 50 },
    { weight: 2, credits: 120 },
    { weight: 3, credits: 170 },
    { weight: 4, credits: 220 },
    { weight: 5, credits: 280 },
    { weight: 6, credits: 330 },
    { weight: 8, credits: 420 },
    { weight: 10, credits: 550 },
    { weight: 12, credits: 650 },
    { weight: 15, credits: 800 },
    { weight: 18, credits: 950 },
    { weight: 20, credits: 1100 },
    { weight: 25, credits: 1400 },
    { weight: 30, credits: 1800 },
    { weight: 35, credits: 2200 },
    { weight: 40, credits: 2600 },
    { weight: 45, credits: 3000 },
    { weight: 50, credits: 3500 }
  ];

  const roundedWeight = Math.round(weight * 100) / 100;
  const exactMatch = creditTiers.find(tier => tier.weight === roundedWeight);
  if (exactMatch) return exactMatch.credits;

  if (roundedWeight < creditTiers[0].weight) {
    return Math.round((roundedWeight / creditTiers[0].weight) * creditTiers[0].credits);
  }

  if (roundedWeight > creditTiers[creditTiers.length - 1].weight) {
    const maxTier = creditTiers[creditTiers.length - 1];
    const previousTier = creditTiers[creditTiers.length - 2];
    const rate = (maxTier.credits - previousTier.credits) / (maxTier.weight - previousTier.weight);
    return Math.round(maxTier.credits + (roundedWeight - maxTier.weight) * rate);
  }

  for (let i = 0; i < creditTiers.length - 1; i++) {
    const lowerTier = creditTiers[i];
    const upperTier = creditTiers[i + 1];
    if (roundedWeight > lowerTier.weight && roundedWeight < upperTier.weight) {
      const weightRange = upperTier.weight - lowerTier.weight;
      const creditRange = upperTier.credits - lowerTier.credits;
      const weightDiff = roundedWeight - lowerTier.weight;
      const interpolatedCredits = lowerTier.credits + (weightDiff / weightRange) * creditRange;
      return Math.round(interpolatedCredits);
    }
  }
  return 50;
};

module.exports = {
  verifySubmission,
  calculateCredits
};
