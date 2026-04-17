const Report = require('../models/Report');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { sendTicketConfirmationEmail } = require('../utils/mailService');

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

    // Generate Human-Readable Ticket ID (TKT-XXXXXX)
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `TKT-${randomNum}`;

    const reportData = {
        user: req.user.id,
        category,
        type,
        message,
        ticketId
    };

    // Add image if uploaded
    if (req.file) {
        reportData.image = `/uploads/${req.file.filename}`;
    }

    const report = await Report.create(reportData);

    // Send confirmation email to the *currently authenticated* user. We use
    // req.user directly (populated by authMiddleware from the verified token)
    // so the mail always lands at the email tied to the active session — not
    // a stale record fetched again from the DB.
    if (req.user && req.user.email) {
        console.log(`📧 Ticket ${ticketId} confirmation → ${req.user.email}`);
        sendTicketConfirmationEmail(req.user, report).catch(err => {
            console.error('📧 Ticket Confirmation Email error:', err);
        });
    } else {
        console.warn(`⚠️ Skipping confirmation email — no email on req.user for ticket ${ticketId}`);
    }

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

// @desc    Lookup ticket status (for chatbot)
// @route   GET /api/reports/lookup/:ticketId
// @access  Public (or Private with simple auth if needed)
exports.lookupTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    if (!ticketId) {
        return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    const report = await Report.findOne({ ticketId })
        .populate('user', 'name')
        .select('ticketId status priority createdAt category type');

    if (!report) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({
        success: true,
        data: report
    });
});

// @desc    Get full details for a single owned ticket
// @route   GET /api/reports/ticket/:ticketId
// @access  Private
exports.getMyTicketById = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    const report = await Report.findOne({ ticketId, user: req.user.id })
        .populate('user', 'name email profilePicture');

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'Ticket not found'
        });
    }

    res.json({
        success: true,
        data: report
    });
});

// @desc    Get all user's tickets (Reports + Submissions)
// @route   GET /api/reports/all-my-tickets
// @access  Private
exports.getMyTickets = asyncHandler(async (req, res) => {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    const submissions = await Submission.find({ user: req.user.id }).sort({ createdAt: -1 });

    const allTickets = [
        ...reports.map(r => ({
            ...r._doc,
            category: 'complaint',
            ticketType: 'Helpdesk'
        })),
        ...submissions.map(s => ({
            ...s._doc,
            category: 'cleanup',
            ticketType: 'Civic Action',
            // Map submission status to unified ticket status for dashboard
            status: s.status === 'pending' ? 'open' : (s.status === 'verified' ? 'resolved' : 'closed'),
            message: s.description,
            type: s.type,
            image: s.photos?.[0] || null
        }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        count: allTickets.length,
        data: allTickets
    });
});

