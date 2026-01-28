const admin = require('../config/firebase');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token with Firebase Admin
    console.log('🔍 Verifying Firebase token...');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Token verified successfully');
    console.log('Firebase UID:', decodedToken.uid);
    console.log('Email:', decodedToken.email);

    // Get user from MongoDB using firebaseUid or email (for legacy migration)
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    console.log('User found by firebaseUid:', !!user);

    if (!user && decodedToken.email) {
      // Fallback: Check by email and link if found
      console.log('Trying fallback: finding user by email...');
      user = await User.findOne({ email: decodedToken.email });
      console.log('User found by email:', !!user);
      if (user) {
        console.log('Linking firebaseUid to existing user');
        user.firebaseUid = decodedToken.uid;
        await user.save();
      }
    }

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Auth successful for user:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth Error:', error.code || error.message);
    if (error.code) {
      console.error('Firebase Error Code:', error.code);
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message
    });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};
