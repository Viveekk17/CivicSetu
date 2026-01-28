const Report = require('../models/Report');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
exports.createReport = asyncHandler(async (req, res) => {
    const { category, type, message } = req.body;

    if (!category || !type || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please provide category, type and message'
        });
    }

    const reportData = {
        user: req.user.id,
        category,
        type,
        message
    };

    // Add image if uploaded
    if (req.file) {
        reportData.image = `/uploads/${req.file.filename}`;
    }

    const report = await Report.create(reportData);

    res.status(201).json({
        success: true,
        data: report,
        message: 'Report submitted successfully'
    });
});

// @desc    Get user's reports
// @route   GET /api/reports/me
// @access  Private
exports.getMyReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: reports.length,
        data: reports
    });
});
