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
  wasteType: {
    type: String,
    enum: ['organic', 'general', 'construction', 'plastic', 'drain', 'hazardous'],
    default: 'general'
  },
  submissionType: {
    type: String,
    enum: ['individual', 'group', 'community'],
    default: 'individual'
  },
  participantCount: {
    type: Number,
    default: 1
  },
  participantIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
  weightKg: {
    type: Number, // alias/normalized for calculator
    default: 0
  },
  areaCriticality: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high', 'critical'],
    default: 'low'
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide location name']
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    district: String
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'verified'],
    default: 'pending'
  },
  totalCreditsAwarded: {
    type: Number,
    default: 0
  },
  perPersonCreditsAwarded: {
    type: Number,
    default: 0
  },
  creditBreakdown: {
    base: Number,
    wasteMultiplier: Number,
    submissionMultiplier: Number,
    criticalityMultiplier: Number,
    streakMultiplier: Number,
    participantCount: Number
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  ticketId: {
    type: String,
    unique: true
  },
  approvalPhase: {
    type: Number,
    enum: [0, 1, 2], // 0: Pending, 1: Action Required (Re-verification), 2: Completed
    default: 0
  },
  reverificationPhoto: {
    type: String
  },
  reverificationDeadline: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  verificationDetails: {
    verifiedAt: Date,
    verifiedBy: String,
    confidence: Number,
    notes: String,
    co2Saved: Number,
    trashWeight: Number,
    category: String,
    suggestedDescription: String,
    suggestedCredits: Number,
    tokensEarned: Number,
    memberCount: Number,
    totalPool: Number,
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
    }]
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
