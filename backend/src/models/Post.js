const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    description: {
        type: String,
        required: true,
        maxLength: 1000
    },
    selectedPhotos: {
        type: [String],
        default: ['before', 'after'],
        enum: ['before', 'after']
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [commentSchema]
}, {
    timestamps: true
});

// Index for faster queries
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1 });

module.exports = mongoose.model('Post', postSchema);
