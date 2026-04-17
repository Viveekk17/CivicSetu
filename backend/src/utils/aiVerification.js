const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Local YOLO weight engine is back as the *fallback* for weight + category
// when Gemini is missing, rate-limited, or returns a non-transient error.
// Gemini still leads when available because it scores environment +
// authenticity in a single call — but we never silently skip AI now.
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT_MS = 30000;
const {
  extractMetadata,
  detectAISoftwareSignature,
  detectBrowserOrScreenshot,
} = require('./metadataService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Outbound HTTP timeout (ms). Without this, a slow Sightengine call can hang
// the Express request indefinitely.
const SIGHTENGINE_TIMEOUT_MS = 20000;

// Layered fraud detection. Each layer contributes a score 0–1; the final
// rejection happens when either a single layer is strongly confident
// (>= REJECT_INDIVIDUAL) or the cumulative weighted score crosses
// REJECT_CUMULATIVE. This avoids any one noisy signal auto-rejecting real
// submissions while still catching multi-signal fakes.
const FRAUD_REJECT_INDIVIDUAL = 0.85;
const FRAUD_REJECT_CUMULATIVE = 1.10;

// Standard weight of one filled garbage bag (kg) — used to cross-check Gemini's
// pile estimate against any visible bags in the after-photo.
const KG_PER_FILLED_BAG = 6;

// Gemini retry policy. Public free-tier endpoints regularly return 503
// "high demand" — one quick retry with a short backoff usually clears it.
const GEMINI_RETRY_DELAY_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Detect transient / capacity errors that warrant a retry or graceful YOLO
// fallback (vs. a hard error surfaced to the user). 503 = UNAVAILABLE,
// 429 = quota, 500 = upstream blip, plus the SDK's text variants.
const isTransientGeminiError = (err) => {
  const msg = (err && err.message) || '';
  return /\b(429|500|502|503|504)\b/.test(msg)
      || /quota|exhausted|unavailable|overload|high demand|temporarily/i.test(msg);
};

// Auth failures should also trigger the local-AI fallback (not bubble up).
// We treat them as "Gemini unavailable for this request" so the user still
// gets an AI-backed weight estimate from the Python service.
const isGeminiAuthError = (err) => {
  const msg = (err && err.message) || '';
  return /\b(400|401|403)\b/.test(msg)
      || /API key|api_key|invalid key|permission|unauthenticated|unauthorized|forbidden/i.test(msg);
};

// Single-retry wrapper around `model.generateContent`. Throws on second
// failure so the caller can decide whether to YOLO-fallback or surface.
const generateWithRetry = async (model, parts) => {
  try {
    return await model.generateContent(parts);
  } catch (err) {
    if (!isTransientGeminiError(err)) throw err;
    console.warn(`⚠️ Gemini transient error (${err.message}). Retrying once in ${GEMINI_RETRY_DELAY_MS}ms...`);
    await sleep(GEMINI_RETRY_DELAY_MS);
    return await model.generateContent(parts);
  }
};

// Initialize Gemini. If the key is missing or obviously malformed, surface it
// at boot so an invalid key doesn't masquerade as a "transient" error during
// the first request. Real AI Studio keys are 39 chars and start with `AIza`.
const RAW_GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const looksLikeRealGeminiKey = /^AIza[0-9A-Za-z_-]{30,}$/.test(RAW_GEMINI_KEY);
if (!RAW_GEMINI_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set — Gemini Vision will be skipped, falling back to local AI service.');
} else if (!looksLikeRealGeminiKey) {
  console.warn(
    `⚠️  GEMINI_API_KEY does not match the AI Studio format (expected "AIza..." 39+ chars). ` +
    `Got prefix "${RAW_GEMINI_KEY.slice(0, 4)}…" — Gemini calls will likely 401. ` +
    `Local AI service will be used as fallback.`
  );
}
const genAI = new GoogleGenerativeAI(RAW_GEMINI_KEY || 'missing-key');
// Try the key if it's there at all — let the SDK tell us it's invalid via a
// real 401, then we fall back to the local YOLO service. Don't pre-emptively
// reject unfamiliar prefixes (Google has multiple key formats now).
const geminiAvailable = !!RAW_GEMINI_KEY;

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
    // Buffered read instead of createReadStream — the latter holds an open fd
    // until garbage collection if axios errors before piping completes.
    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append('media', fileBuffer, { filename: path.basename(filePath) });
    formData.append('models', 'genai');
    formData.append('api_user', user);
    formData.append('api_secret', secret);

    const response = await axios.post('https://api.sightengine.com/1.0/check.json', formData, {
      headers: formData.getHeaders(),
      timeout: SIGHTENGINE_TIMEOUT_MS,
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
 * Calls the local Python YOLO weight estimator. Returns null on any failure
 * (service down, timeout, malformed response) so the caller can decide what
 * to do — never throws.
 */
const callLocalAIService = async (beforeImagePath, afterImagePath) => {
  try {
    if (!fs.existsSync(beforeImagePath)) return null;
    const formData = new FormData();
    formData.append('before_image', fs.createReadStream(beforeImagePath), {
      filename: path.basename(beforeImagePath),
    });
    formData.append('after_image', fs.createReadStream(afterImagePath || beforeImagePath), {
      filename: path.basename(afterImagePath || beforeImagePath),
    });

    console.log(`🐍 Calling local AI service at ${AI_SERVICE_URL}/process-cleanup ...`);
    const response = await axios.post(`${AI_SERVICE_URL}/process-cleanup`, formData, {
      headers: formData.getHeaders(),
      timeout: AI_SERVICE_TIMEOUT_MS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const data = response?.data?.data;
    if (!data || !Number.isFinite(Number(data.total_weight_kg))) return null;
    return {
      weight: Math.max(0, Number(data.total_weight_kg)),
      itemsDetected: Number(data.items_detected) || 0,
      method: data.method || 'yolo',
      breakdown: data.material_breakdown || {},
      details: data.details || [],
    };
  } catch (err) {
    console.warn(`⚠️ Local AI service unreachable (${err.code || err.message}).`);
    return null;
  }
};

// Build a verification verdict purely from the local Python service. Used
// when Gemini is unavailable (missing key) or returned a non-transient error.
const verdictFromLocalService = async (beforeImagePath, afterImagePath, userClaim, layers) => {
  const local = await callLocalAIService(beforeImagePath, afterImagePath);
  if (!local) return null;

  const fw = Math.min(
    500,
    local.weight > 0
      ? local.weight
      : (Number.isFinite(userClaim) && userClaim > 0 ? userClaim : 1)
  );
  const tokens = Math.ceil(fw * 10);
  const co2 = parseFloat((fw * 1.2).toFixed(2));
  const breakdownStr = Object.entries(local.breakdown)
    .map(([m, w]) => `${m} ${w}kg`)
    .join(', ') || 'no material breakdown';

  console.log(
    `✅ LOCAL-AI FLOW COMPLETE: items=${local.itemsDetected} ` +
    `weight=${fw}kg method=${local.method}`
  );

  return {
    verified: true,
    confidence: 0.6,
    credits: calculateCredits(fw),
    tokensEarned: tokens,
    co2Saved: co2,
    trashWeight: parseFloat(fw.toFixed(2)),
    category: 'garbage',
    suggestedDescription: `Local YOLO weight estimate: ${fw.toFixed(2)} kg across ${local.itemsDetected} item(s).`,
    notes: `Gemini unavailable. Local AI service estimated ${fw.toFixed(2)} kg (${breakdownStr}). Flagged for admin review.`,
    fraudLayers: layers,
    weightSource: `local_yolo(${local.itemsDetected} items)`,
  };
};

/**
 * Sequential AI analysis flow (in order):
 *   PHASE 1 — EXIF metadata check (AI software + browser/screenshot signatures)
 *   PHASE 2 — Sightengine pixel-level GenAI classifier
 *   PHASE 3 — Gemini Vision (single comprehensive call):
 *               • environment validation  (outdoor public vs indoor/private)
 *               • garbage classification + weight estimation
 *               • bag-count cross-check   (after-photo bags × ~6 kg)
 *               • user-claim sanity check (catches obvious inflation)
 *   PHASE 4 — YOLO fallback (local Python service): runs ONLY if Gemini is
 *             missing/invalid/quota'd/down. It produces weight + category
 *             but does not re-validate the environment.
 */
const verifySubmission = async (type, photos, weight) => {
  try {
    if (!photos || photos.length === 0) {
      return { verified: false, confidence: 0, credits: 0, notes: 'No photos provided' };
    }

    const resolvePath = (p) => (path.isAbsolute(p) ? p : path.join(__dirname, '../../', p));
    const beforeImagePath = resolvePath(photos[0]);
    const afterImagePath = photos[1] ? resolvePath(photos[1]) : beforeImagePath;

    const layers = [];

    // ─── PHASE 1: EXIF metadata check ────────────────────────────────────
    console.log('🛡️ PHASE 1: EXIF metadata check...');
    let metadata = null;
    try {
      metadata = await extractMetadata(beforeImagePath);

      const aiSig = detectAISoftwareSignature(metadata);
      if (aiSig.isAIGenerated) {
        layers.push({ layer: 'ai_signature', score: aiSig.confidence, reason: aiSig.reason });
        console.log(`  · ai_signature ${aiSig.confidence} — ${aiSig.reason}`);
        if (aiSig.confidence >= FRAUD_REJECT_INDIVIDUAL) {
          return {
            verified: false,
            isFraud: true,
            confidence: aiSig.confidence,
            notes: `Rejected: image metadata identifies a generative-AI tool (${aiSig.detectedSoftware}).`,
            fraudLayers: layers,
          };
        }
      }

      const browserCheck = detectBrowserOrScreenshot(metadata, beforeImagePath);
      if (browserCheck.isBrowserSourced) {
        layers.push({ layer: 'browser_source', score: browserCheck.confidence, reason: browserCheck.reason });
        console.log(`  · browser_source ${browserCheck.confidence} — ${browserCheck.reason}`);
      }
    } catch (err) {
      console.warn('⚠️ EXIF extraction failed:', err.message);
    }

    // ─── PHASE 2: Sightengine pixel-level GenAI check ────────────────────
    console.log('🛡️ PHASE 2: Sightengine pixel-level check...');
    const isSightengineAI = await checkFraudSightengine(beforeImagePath);
    if (isSightengineAI) {
      console.log('❌ Rejected by Sightengine pixel-level GenAI classifier.');
      layers.push({ layer: 'sightengine_pixel', score: 0.9, reason: 'Pixel-level GenAI classifier triggered' });
      return {
        verified: false,
        isFraud: true,
        confidence: 0.9,
        notes: 'Rejected: pixel-level analysis flagged this image as AI-generated.',
        fraudLayers: layers,
      };
    }

    // Cumulative cap as a backstop — multiple soft signals together can
    // still trigger a rejection even if no single layer is decisive.
    const cumulativeScore = layers.reduce((s, l) => s + l.score, 0);
    if (cumulativeScore >= FRAUD_REJECT_CUMULATIVE) {
      const summary = layers.map(l => `${l.layer}=${l.score.toFixed(2)}`).join(', ');
      console.log(`❌ Rejected on cumulative fraud score ${cumulativeScore.toFixed(2)} (${summary}).`);
      return {
        verified: false,
        isFraud: true,
        confidence: Math.min(1, cumulativeScore),
        notes: `Rejected after multiple soft signals (${summary}).`,
        fraudLayers: layers,
      };
    }

    const userClaim = Number(weight);

    // ─── PHASE 3: Gemini Vision — environment + garbage + weight ─────────
    if (!geminiAvailable) {
      console.warn('⚠️ GEMINI_API_KEY missing/invalid — skipping Phase 3 and going straight to PHASE 4 (YOLO).');
      console.log('🐍 PHASE 4: Local YOLO weight estimator (Gemini unavailable)...');
      const localVerdict = await verdictFromLocalService(beforeImagePath, afterImagePath, userClaim, layers);
      if (localVerdict) return localVerdict;

      // Last resort if even the Python service is offline.
      const fw = Number.isFinite(userClaim) && userClaim > 0 ? userClaim : 1;
      return {
        verified: true,
        confidence: 0.35,
        credits: calculateCredits(fw),
        tokensEarned: Math.ceil(fw * 10),
        co2Saved: parseFloat((fw * 1.2).toFixed(2)),
        trashWeight: fw,
        category: 'garbage',
        suggestedDescription: 'AI analysis unavailable (Gemini key missing AND local AI service offline).',
        notes: 'Both Gemini and the local YOLO service are unreachable — flagged for manual review.',
        fraudLayers: layers,
      };
    }

    console.log('🌍 PHASE 3: Gemini Vision — environment + weight + bag cross-check...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const userClaimLine = Number.isFinite(userClaim) && userClaim > 0
      ? `The user claims they removed approximately ${userClaim} kg. Treat this only as a hint — your own visual estimate is authoritative. If your estimate diverges from the user's claim by more than 3× in either direction, set "claim_mismatch": true and explain in "ai_note".`
      : `The user did not provide a weight estimate. Produce your own.`;

    const hasAfterPhoto = beforeImagePath !== afterImagePath;

    const prompt = `
You are a senior environmental-audit specialist for a public cleanup verification platform.
You receive a BEFORE photo of a polluted site and ${hasAfterPhoto ? 'an AFTER photo of the same site post-cleanup' : 'optionally an AFTER photo'}.
Your job is to: (1) confirm the location is a valid public/outdoor environment,
(2) estimate the weight of garbage removed in kilograms with a defensible method,
and (3) cross-check that estimate against any filled bags visible in the after-photo.

══════════ ENVIRONMENT RULES — strict ══════════
ELIGIBLE outdoor public / natural settings:
  street, road, footpath, alley, park, public garden, playground, beach,
  shoreline, riverbank, lakeside, pond, forest trail, hillside, vacant
  public lot, market area, bus/train station surroundings, public drain,
  storm drain, canal, public parking lot, religious-site exterior.

INELIGIBLE — set "is_public_space": false AND "category": "invalid":
  inside any home (kitchen, bathroom, bedroom, living room, hallway),
  balcony or rooftop of a private house, private garden, private compound
  / driveway behind a gate, indoor office, shop interior, restaurant
  interior, garage, workshop interior, classroom, hotel room, vehicle
  interior, factory floor, staged studio shot, anything obviously inside
  a private property boundary.

══════════ WEIGHT-ESTIMATION METHOD — show your work ══════════
Step 1 — pick a REFERENCE OBJECT visible in the BEFORE photo and use these
typical real-world sizes to derive scale:
   • Standard door             ≈ 200 cm tall
   • Adult human               ≈ 160–175 cm tall
   • Road curb                 ≈ 12–15 cm tall
   • Standard plastic bottle   ≈ 25 cm tall (500 ml)
   • Sedan car wheel           ≈ 60 cm diameter
   • Brick                     ≈ 19 cm long
   • A4 sheet                  ≈ 30 cm long
   • Broom handle              ≈ 130 cm
   • Filled garbage bag        ≈ 60 cm tall, ~6 kg

Step 2 — estimate the trash pile's footprint area (m²) and average
depth (cm) using that scale.

Step 3 — apply a realistic LOOSE-PACKED density:
   • Dry plastic / paper / wrappers          → 60–100 kg/m³
   • Mixed dry household refuse              → 150–250 kg/m³
   • Wet organic / food waste                → 350–500 kg/m³
   • Construction debris / brick / concrete  → 800–1200 kg/m³
   • Beach / sand-mixed litter               → 200–400 kg/m³
Default to "mixed dry refuse 200 kg/m³" if unsure.

Step 4 — weight (kg) = footprint_area_m² × depth_m × density.
Round to one decimal. Reasonable real-world ranges:
   • Single discarded wrapper / can         → 0.05–0.5 kg
   • Small scattered litter (handful)       → 0.5–2 kg
   • Small concentrated pile                → 2–8 kg
   • Medium pile (knee-high, 1 m wide)      → 8–25 kg
   • Large pile (waist-high, 2 m wide)      → 25–80 kg
   • Truck-load                             → 80–500 kg
NEVER return 0 if you can see any garbage. Cap reported weight at 500 kg.

══════════ BAG CROSS-CHECK ══════════
Count any FILLED garbage bags visible in the AFTER photo (not empty bags
held by people, not random plastic bags in the before photo). Each
filled bag ≈ ${KG_PER_FILLED_BAG} kg. If your weight estimate and bag count
disagree by more than 2×, prefer the bag-derived weight and explain.

══════════ USER CLAIM ══════════
${userClaimLine}

══════════ OUTPUT — return ONE JSON object, no prose, no markdown ══════════
{
  "is_public_space":   boolean,
  "environment_type":  "street" | "park" | "beach" | "riverbank" | "forest" | "drain" | "vacant_lot" | "market" | "indoor" | "private_home" | "other",
  "location_match":    boolean,                                  // before & after appear to be the same site
  "category":          "garbage" | "water" | "methane" | "restoration" | "invalid",
  "reference_object":  "string — what you used for scale (e.g. 'sedan wheel', 'curb')",
  "estimated_area_m2": number,                                   // footprint
  "estimated_depth_cm": number,                                  // average depth
  "density_kg_m3":     number,                                   // density you applied
  "weight_from_geometry_kg": number,                             // step-4 result
  "filled_bags_in_after": number,                                // 0 if none
  "weight_from_bags_kg":   number,                               // bags × ${KG_PER_FILLED_BAG}, 0 if no bags
  "trash_weight_kg":   number,                                   // FINAL — your best single estimate
  "claim_mismatch":    boolean,
  "description":       "1–2 sentence professional summary of the cleanup",
  "ai_note":           "short rationale for the weight + any concerns",
  "confidence":        number between 0 and 1
}`.trim();

    const imageParts = [
      fileToGenerativePart(beforeImagePath, 'image/jpeg'),
      fileToGenerativePart(afterImagePath,  'image/jpeg'),
    ];

    let semanticResult;
    try {
      const result = await generateWithRetry(model, [prompt, ...imageParts]);
      const responseText = result.response.text();
      console.log('📝 Raw Gemini Response:', responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON format in Gemini response');
      semanticResult = JSON.parse(jsonMatch[0]);
    } catch (apiError) {
      const reason = /quota|exhausted|429/i.test(apiError.message) ? 'quota'
                   : isGeminiAuthError(apiError) ? 'auth'
                   : isTransientGeminiError(apiError) ? 'overload'
                   : 'error';
      console.warn(`⚠️ Gemini ${reason} (${apiError.message}). Falling back to PHASE 4 (local YOLO).`);
      console.log('🐍 PHASE 4: Local YOLO weight estimator (Gemini failure fallback)...');

      const localVerdict = await verdictFromLocalService(beforeImagePath, afterImagePath, userClaim, layers);
      if (localVerdict) {
        localVerdict.notes = `Gemini ${reason} — used local YOLO instead. ${localVerdict.notes}`;
        return localVerdict;
      }

      // No local service either — only now degrade gracefully (only for
      // transient/auth Gemini errors; truly unexpected exceptions still
      // bubble up so the outer catch can land on mockVerification).
      if (isTransientGeminiError(apiError) || isGeminiAuthError(apiError)) {
        const fw = Number.isFinite(userClaim) && userClaim > 0 ? userClaim : 1;
        return {
          verified: true,
          confidence: 0.4,
          credits: calculateCredits(fw),
          tokensEarned: Math.ceil(fw * 10),
          co2Saved: parseFloat((fw * 1.2).toFixed(2)),
          trashWeight: parseFloat(fw.toFixed(2)),
          category: 'garbage',
          suggestedDescription: `Gemini ${reason} and local AI service offline.`,
          notes: `Gemini ${reason}. Local YOLO unreachable. Used user-claim weight ${fw} kg. Flagged for admin review.`,
          fraudLayers: layers,
        };
      }
      throw apiError;
    }

    const isPublicSpace = semanticResult.is_public_space === true;
    const locationMatch = semanticResult.location_match === true;
    const envType = typeof semanticResult.environment_type === 'string'
      ? semanticResult.environment_type
      : 'other';
    const category = typeof semanticResult.category === 'string'
      ? semanticResult.category
      : 'garbage';

    // Hard environment rejection — anything indoors / private / staged.
    const invalidEnvironments = new Set(['indoor', 'private_home']);
    const isInvalidEnv = !isPublicSpace || invalidEnvironments.has(envType) || category === 'invalid';

    // Reconcile the three weight signals Gemini returned.
    const wGeometry = Number(semanticResult.weight_from_geometry_kg);
    const wBags     = Number(semanticResult.weight_from_bags_kg);
    const wFinal    = Number(semanticResult.trash_weight_kg);
    const bagCount  = Number(semanticResult.filled_bags_in_after);

    let finalWeight = Number.isFinite(wFinal) && wFinal > 0 ? wFinal : 0;
    let weightSource = 'gemini_final';

    // If Gemini's geometry estimate diverges sharply from the bag count,
    // prefer the bag count — it's the most physically grounded signal.
    if (Number.isFinite(wBags) && wBags > 0 && Number.isFinite(wGeometry) && wGeometry > 0) {
      const ratio = Math.max(wBags, wGeometry) / Math.min(wBags, wGeometry);
      if (ratio > 2) {
        finalWeight = wBags;
        weightSource = `bag_count(${bagCount}×${KG_PER_FILLED_BAG}kg)`;
      }
    }

    // Last-resort backstop — never let weight be 0 / non-finite.
    if (!Number.isFinite(finalWeight) || finalWeight <= 0) {
      finalWeight = Number.isFinite(userClaim) && userClaim > 0 ? userClaim : 1;
      weightSource = 'user_claim_fallback';
    }

    finalWeight = Math.min(finalWeight, 500);  // hard cap

    const tokens = Math.ceil(finalWeight * 10);
    const co2 = parseFloat((finalWeight * 1.2).toFixed(2));
    const verified = !isInvalidEnv && locationMatch;

    console.log(
      `✅ AI FLOW COMPLETE: env=${envType} public=${isPublicSpace} ` +
      `geom=${wGeometry}kg bags=${wBags}kg final=${finalWeight}kg [${weightSource}] verified=${verified}`
    );

    if (isInvalidEnv) {
      return {
        verified: false,
        isFraud: false,
        confidence: Number.isFinite(semanticResult.confidence) ? semanticResult.confidence : 0.7,
        credits: 0,
        tokensEarned: 0,
        co2Saved: 0,
        trashWeight: parseFloat(finalWeight.toFixed(2)),
        category: 'invalid',
        environmentType: envType,
        suggestedDescription: semanticResult.description || '',
        notes: `Rejected: scene appears to be ${envType.replace('_', ' ')}. Submissions must be from outdoor public or natural environments (street, park, beach, riverbank, etc.).`,
        fraudLayers: layers,
      };
    }

    return {
      verified,
      confidence: Number.isFinite(semanticResult.confidence) ? semanticResult.confidence : 0.8,
      credits: verified ? calculateCredits(finalWeight) : 0,
      tokensEarned: verified ? tokens : 0,
      co2Saved: verified ? co2 : 0,
      trashWeight: parseFloat(finalWeight.toFixed(2)),
      category,
      environmentType: envType,
      suggestedDescription: semanticResult.description || '',
      notes: semanticResult.ai_note ||
        `Analysis complete. Scene: ${envType}. Weight ${finalWeight.toFixed(2)} kg via ${weightSource}.`,
      fraudLayers: layers,
    };
  } catch (error) {
    console.error('❌ AI FLOW ERROR:', error.stack || error.message);
    return mockVerification(type, weight);
  }
};

// Fallback when the AI flow throws unrecoverably. Deterministic — random
// rejection used to silently drop ~5% of real submissions and trigger the
// controller's "rejected" branch that deletes the user's photos. Now we
// always pass photos through and flag for admin review.
const mockVerification = (type, weight = 1) => {
  const w = Number.isFinite(weight) && weight > 0 ? weight : 1;
  const credits = calculateCredits(w);

  return {
    verified: true,
    confidence: 0.5,
    credits,
    tokensEarned: Math.ceil(w * 10),
    co2Saved: parseFloat((w * 1.2).toFixed(2)),
    trashWeight: w,
    category: type || 'garbage',
    suggestedDescription: '',
    notes: 'AI service unreachable — submission flagged for manual admin review.',
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
