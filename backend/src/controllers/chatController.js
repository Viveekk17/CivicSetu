const chatService = require('../services/chatService');
const Report = require('../models/Report');
const Submission = require('../models/Submission');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Handle incoming chat messages for the Smart Assistant
 * @route   POST /api/chat
 * @access  Public (Optional Auth)
 */
exports.handleChatMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a message'
        });
    }

    const context = {
        userState: req.user ? 'Authenticated' : 'Guest',
        userName: req.user ? req.user.name : null,
        recentTickets: [],
        recentSubmissions: [],
        currentCredits: req.user ? req.user.credits : 0
    };

    if (req.user) {
        // Fetch recent tickets (last 5 reports)
        const tickets = await Report.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('ticketId status priority category type message isEscalated');
        
        context.recentTickets = tickets.map(t => ({
            id: t.ticketId,
            status: t.status,
            priority: t.priority,
            description: t.message,
            isEscalated: t.isEscalated
        }));

        // Fetch recent cleanup submissions
        const submissions = await Submission.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('ticketId status totalCreditsAwarded weight submittedAt');
        
        context.recentSubmissions = submissions.map(s => ({
            id: s.ticketId,
            status: s.status,
            creditsAwarded: s.totalCreditsAwarded,
            weight: s.weight + ' kg',
            date: s.submittedAt
        }));
    }

    // Get response from chat service
    const response = await chatService.getAssistantResponse(message, context);

    // Save the conversation to database if user is authenticated
    if (req.user) {
        try {
            await ChatMessage.findOneAndUpdate(
                { user: req.user._id },
                { 
                    $push: { 
                        messages: [
                            { type: 'user', text: message },
                            { type: 'bot', text: response }
                        ] 
                    } 
                },
                { upsert: true, new: true }
            );
        } catch (dbError) {
            console.error('⚠️ Failed to save chat message:', dbError.message);
            // Don't fail the response if DB save fails
        }
    }

    res.json({
        success: true,
        data: {
            response: response
        }
    });
});

/**
 * Get chat history for the current user
 * @route   GET /api/chat/history
 * @access  Private
 */
exports.getChatHistory = asyncHandler(async (req, res) => {
    const history = await ChatMessage.findOne({ user: req.user._id });
    
    if (!history) {
        return res.json({
            success: true,
            data: []
        });
    }

    // Load last 30 messages to keep UI fast
    const recentMessages = history.messages.slice(-30);

    res.json({
        success: true,
        data: recentMessages
    });
});
