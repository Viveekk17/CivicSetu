const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/mailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { email },
      { email, otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send Email
    const emailRes = await sendOTPEmail(email, otp);

    if (!emailRes.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role,
          impact: user.impact || { pollutionSaved: 0, treesPlanted: 0 }
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role,
          impact: user.impact || { pollutionSaved: 0, treesPlanted: 0 }
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login/Register with Firebase
// @route   POST /api/auth/firebase
// @access  Public
exports.firebaseLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a firebase token'
      });
    }

    // Verify token
    const admin = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture, phone_number } = decodedToken;
    const provider = decodedToken.firebase.sign_in_provider; // 'phone', 'google.com', 'password'

    console.log(`Login attempt: Provider=${provider}, UID=${uid}, Email=${email}, Phone=${phone_number}`);

    // Check if user exists by firebaseUid
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // If not found by UID, try alternative lookups to link accounts

      // 1. Try by Email (if available)
      if (email) {
        user = await User.findOne({ email });
      }

      // 2. Try by Phone Number (if available and not found yet)
      if (!user && phone_number) {
        user = await User.findOne({ phoneNumber: phone_number });
      }

      if (user) {
        // Link existing user
        console.log(`Linking existing user: ${user._id}`);
        user.firebaseUid = uid;
        if (!user.email && email) user.email = email;
        if (!user.phoneNumber && phone_number) user.phoneNumber = phone_number;
        // Update profile if needed
        if (!user.profilePicture && picture) user.profilePicture = picture;
        await user.save();
      } else {
        // New User - Do NOT create yet, return isNewUser flag
        console.log('New phone user detected, waiting for username setup');
        return res.status(200).json({
          success: true,
          isNewUser: true,
          token: token, // Send back firebase token for next step
          firebaseUid: uid,
          email,
          phone_number
        });
      }
    }

    // Existing user login
    const appToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      isNewUser: false,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role,
          profilePicture: user.profilePicture,
          impact: user.impact || { pollutionSaved: 0, treesPlanted: 0 }
        },
        token: appToken
      }
    });

  } catch (error) {
    console.error('Firebase Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Complete phone registration with username
// @route   POST /api/auth/phone-register
// @access  Public
exports.completePhoneRegistration = async (req, res) => {
  try {
    const { token, name } = req.body;

    if (!token || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and username'
      });
    }

    // Verify token again
    const admin = require('../config/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, picture, phone_number } = decodedToken;

    // Double check if user already exists
    let user = await User.findOne({ firebaseUid: uid });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already registered'
      });
    }

    // Create new user
    console.log('Creating new user with username:', name);
    const userData = {
      name: name,
      firebaseUid: uid,
      profilePicture: picture || '/uploads/default-avatar.png',
      role: 'user', // Default role
      credits: 0
    };

    if (email) userData.email = email;
    if (phone_number) userData.phoneNumber = phone_number;

    user = await User.create(userData);

    // Generate app token
    const appToken = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          role: user.role,
          profilePicture: user.profilePicture,
          impact: user.impact || { pollutionSaved: 0, treesPlanted: 0 }
        },
        token: appToken
      }
    });

  } catch (error) {
    console.error('Phone Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
