const { exiftool } = require('exiftool-vendored');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extracts metadata from an image file using ExifTool
 * @param {string} filePath Absolute path to the image
 * @returns {Promise<Object>} Metadata object
 */
const extractMetadata = async (filePath) => {
  try {
    console.log(`🔍 Extracting metadata from: ${filePath}`);
    const metadata = await exiftool.read(filePath);
    return metadata;
  } catch (err) {
    console.error('❌ ExifTool error:', err.message);
    throw new Error('Failed to extract image metadata');
  }
};

/**
 * Uses Gemini to analyze metadata for signs of AI generation
 * @param {Object} metadata Metadata object from ExifTool
 * @returns {Promise<Object>} Analysis result { isAIGenerated, confidence, reason }
 */
const checkAIGenerated = async (metadata) => {
  try {
    console.log('🤖 Sending metadata to Gemini for AI analysis...');
    
    // Clean up metadata to remove very large binary fields or redundant info to save tokens
    const simplifiedMetadata = { ...metadata };
    delete simplifiedMetadata.SourceFile;
    delete simplifiedMetadata.errors;
    delete simplifiedMetadata.warnings;
    // Remove complex thumbnail or profile data if they exist
    Object.keys(simplifiedMetadata).forEach(key => {
      if (typeof simplifiedMetadata[key] === 'object' || Array.isArray(simplifiedMetadata[key])) {
        // Keep some useful objects but stringify or prune others
        if (key !== 'XMP' && key !== 'EXIF' && key !== 'IPTC') {
           delete simplifiedMetadata[key];
        }
      }
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are a digital forensics expert specialized in identifying AI-generated and AI-manipulated images through metadata analysis.
      
      CRITICAL INSTRUCTION: Modern mobile devices (like Samsung Galaxy S23/S24) use "Content Credentials" (C2PA) to sign images. While C2PA is intended to prove authenticity, it is often the PRIMARY indicator that an image was EDITED with Generative AI (e.g., Samsung Galaxy AI Generative Edit).
      
      Analyze the following metadata and determine if the image is:
      1. A completely real, unedited photograph.
      2. An AI-generated image (e.g., Midjourney).
      3. A real photograph where objects were removed or added using Generative AI (e.g., Galaxy AI, Magic Eraser, Adobe Firefly).
      
      Look for:
      1. **Samsung Galaxy AI Markers**: 
         - Check 'C2PA' or 'Claim_generator' for "c2pa-rs" or "Galaxy" strings. 
         - Look for 'History' tags where 'Action' is "converted" or "saved" and 'SoftwareAgent' mentions "Generative AI" or "Object Eraser".
      2. **C2PA Manifests**: If a 'Manifest' or 'Content Credentials' claim exists, it often means the image was processed by a generative engine.
      3. **Software Signatures**: "Midjourney", "Stable Diffusion", "DALL-E", "Adobe Firefly", "LucidPic".
      4. **Lack of Hardware Data**: Absence of standard EXIF (Make, Model, Lens, ISO, FNumber, GPS) is a red flag for pure AI generation.
      
      Metadata:
      ${JSON.stringify(simplifiedMetadata, null, 2)}
      
      IMPORTANT: Return ONLY a valid JSON object:
      {
        "isAIGenerated": boolean, // Set to true if ANY generative AI was used (generation OR editing/removal)
        "confidence": number (0-1),
        "reason": "Explain your findings. If C2PA/Content Credentials are present, explain if they indicate AI-manipulation (like Galaxy AI) or simply a copyright claim.",
        "detectedSoftware": "name of software/engine if found, otherwise null"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response (Gemini sometimes wraps it in markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log('✅ AI Metadata Analysis Result:', analysis);
    return analysis;
  } catch (err) {
    console.error('❌ Gemini analysis error:', err.message);
    // Graceful fallback: assume not AI but log error
    return {
      isAIGenerated: false,
      confidence: 0,
      reason: "Analysis failed: " + err.message,
      detectedSoftware: null
    };
  }
};

module.exports = {
  extractMetadata,
  checkAIGenerated
};
