const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide tree name'],
    trim: true
  },
  cost: {
    type: Number,
    required: [true, 'Please provide cost in credits'],
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['trees', 'bundles', 'wildlife', 'offset', 'transport', 'utilities', 'goodies', 'recognition'],
    default: 'trees'
  },
  image: {
    type: String,
    default: '/uploads/default-tree.png'
  },
  available: {
    type: Boolean,
    default: true
  },
  impact: {
    co2Offset: {
      type: Number,
      default: 0
    },
    description: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tree', treeSchema);
