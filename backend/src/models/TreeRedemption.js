const mongoose = require('mongoose');

const treeRedemptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    treesRequested: {
        type: Number,
        required: true,
        min: 1
    },
    creditsSpent: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'sent_to_ngo', 'planting_in_process', 'completed'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'sent_to_ngo', 'planting_in_process', 'completed']
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    adminNotes: {
        type: String,
        default: ''
    },
    redeemedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
treeRedemptionSchema.index({ user: 1, createdAt: -1 });
treeRedemptionSchema.index({ status: 1 });

// Virtual for formatted status
treeRedemptionSchema.virtual('statusDisplay').get(function () {
    const statusMap = {
        pending: 'Pending',
        sent_to_ngo: 'Sent to NGO',
        planting_in_process: 'Planting in Process',
        completed: 'Completed'
    };
    return statusMap[this.status] || this.status;
});

// Ensure virtuals are included in JSON
treeRedemptionSchema.set('toJSON', { virtuals: true });
treeRedemptionSchema.set('toObject', { virtuals: true });

const TreeRedemption = mongoose.model('TreeRedemption', treeRedemptionSchema);

module.exports = TreeRedemption;
