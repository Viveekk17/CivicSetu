const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [{
    type: {
      type: String,
      enum: ['bot', 'user'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Delete old messages if the user clears chat or for maintenance
// For now, we just index user for fast lookup
chatMessageSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
