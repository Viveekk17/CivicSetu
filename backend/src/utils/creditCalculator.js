const WASTE_MULTIPLIERS = {
  organic: 0.8,
  general: 1.0,
  construction: 1.3,
  plastic: 1.5,
  drain: 1.8,
  hazardous: 2.0,
};

const SUBMISSION_MULTIPLIERS = {
  individual: 1.0,
  group: 1.4,
  community: 1.7,
};

const CRITICALITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.5,
  high: 2.0,
  very_high: 2.5,
  critical: 3.0,
};


/**
 * Calculate credits for a cleanup submission
 * @param {Object} data 
 * @returns {Object} { totalCredits, perPersonCredits, breakdown }
 */
function calculateCredits({
  weightKg,
  wasteType,
  submissionType,
  areaCriticality,
  participantCount = 1,
}) {
  const base = weightKg * 10;
  const wasteM = WASTE_MULTIPLIERS[wasteType] ?? 1.0;
  const subM = SUBMISSION_MULTIPLIERS[submissionType] ?? 1.0;
  const critM = CRITICALITY_MULTIPLIERS[areaCriticality] ?? 1.0;

  // Total credits calculation
  let totalCredits = Math.round(base * wasteM * subM * critM);

  // Apply minimum credits rule
  if (totalCredits < 5 && weightKg > 0) {
    totalCredits = 5;
  }

  const perPersonCredits =
    submissionType === "individual"
      ? totalCredits
      : Math.floor(totalCredits / participantCount);

  return {
    totalCredits,
    perPersonCredits,
    breakdown: {
      base,
      wasteMultiplier: wasteM,
      submissionMultiplier: subM,
      criticalityMultiplier: critM,
      participantCount,
      minCreditsApplied: totalCredits === 5 && (base * wasteM * subM * critM) < 5
    },
  };
}

module.exports = { 
  calculateCredits,
  WASTE_MULTIPLIERS,
  SUBMISSION_MULTIPLIERS,
  CRITICALITY_MULTIPLIERS
};
