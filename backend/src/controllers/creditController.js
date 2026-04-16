const MCZone = require('../models/MCZone');
const User = require('../models/User');
const { calculateCredits } = require('../utils/creditCalculator');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get credit estimate
// @route   GET /api/credits/estimate
// @access  Public
exports.getEstimate = asyncHandler(async (req, res) => {
    const { 
        weightKg, 
        wasteType, 
        submissionType, 
        participantCount, 
        lat, 
        lng, 
        userId 
    } = req.query;

    if (!weightKg || !wasteType || !submissionType) {
        return res.status(400).json({
            success: false,
            message: 'Please provide weightKg, wasteType and submissionType'
        });
    }

    // 1. Determine Area Criticality
    let areaCriticality = 'low';
    let zoneName = 'Default Zone';

    if (lat && lng) {
        // Find zone by proximity
        const zone = await MCZone.findOne({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: 5000 // 5km search radius
                }
            }
        });

        if (zone) {
            areaCriticality = zone.criticality;
            zoneName = zone.name;
        }
    }

    // 3. Calculate
    const result = calculateCredits({
        weightKg: parseFloat(weightKg),
        wasteType,
        submissionType,
        areaCriticality,
        participantCount: parseInt(participantCount) || 1
    });

    res.json({
        success: true,
        data: {
            ...result,
            zone: {
                name: zoneName,
                criticality: areaCriticality
            }
        }
    });
});

// @desc    Get zone criticality
// @route   GET /api/zones/criticality
// @access  Public
exports.getZoneCriticality = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            message: 'Please provide lat and lng'
        });
    }

    const zone = await MCZone.findOne({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: 5000
            }
        }
    });

    if (!zone) {
        return res.json({
            success: true,
            data: {
                name: 'Standard Area',
                criticality: 'low',
                multiplier: 1.0
            }
        });
    }

    const multipliers = {
        low: 1.0,
        medium: 1.5,
        high: 2.0,
        very_high: 2.5,
        critical: 3.0
    };

    res.json({
        success: true,
        data: {
            name: zone.name,
            criticality: zone.criticality,
            multiplier: multipliers[zone.criticality]
        }
    });
});
