const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allow null/undefined values to exist alongside unique constraint
  },
  password: {
    type: String,
    required: false, // Optional for Google Auth / Firebase Auth users
    minlength: 6,
    select: false // Don't return password by default
  },
  credits: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  inventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tree'
    },
    name: String,
    category: String,
    acquiredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
