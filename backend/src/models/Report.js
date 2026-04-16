const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['civic', 'platform'],
        required: true
    },
    type: {
        type: String,
        enum: [
            // Civic
            'dumping', 'government', 'waterbody', 'other_civic',
            // Platform
            'submission', 'credit', 'bug', 'other_platform'
        ],
        required: true
    },
    ticketId: {
        type: String,
        unique: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        trim: true,
        minlength: 10
    },
    image: {
        type: String
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
        default: 'open'
    },
    isEscalated: {
        type: Boolean,
        default: false
    },
    escalatedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
