const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['garbage', 'water', 'methane', 'restoration'],
    required: [true, 'Please specify submission type']
  },
  photos: [{
    type: String,
    required: true
  }],
  imageHashes: [{
    type: String,
    required: true,
    index: true
  }],
  weight: {
    type: Number,
    min: 0
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide location name']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  creditsAwarded: {
    type: Number,
    default: 0
  },
  verificationDetails: {
    verifiedAt: Date,
    verifiedBy: {
      type: String,
      default: 'AI'
    },
    confidence: Number,
    notes: String,
    suggestedCredits: Number,
    taggingMode: {
      type: String,
      enum: ['members', 'community', 'ngo'],
      default: 'members'
    },
    taggedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    taggedCommunities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }],
    co2Saved: Number,
    trashWeight: Number,
    category: String,
    suggestedDescription: String
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
