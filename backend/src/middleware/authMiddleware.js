const firebaseAdmin = require('../config/firebase');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

  // --- Strategy 1: Try Backend JWT (used by adminLogin / direct login) ---
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      return next();
    }
  } catch (jwtError) {
    // Not a valid JWT — fall through to Firebase verification
  }

  // --- Strategy 2: Try Firebase ID Token (used by regular citizen login) ---
  try {
    console.log('🔍 Verifying Firebase token...');
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    console.log('✅ Firebase token verified, UID:', decodedToken.uid);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user && decodedToken.email) {
      user = await User.findOne({ email: decodedToken.email });
      if (user) {
        user.firebaseUid = decodedToken.uid;
        await user.save();
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    return next();
  } catch (firebaseError) {
    console.error('❌ Auth Error:', firebaseError.code || firebaseError.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: firebaseError.message
    });
  }
};

/**
 * Optional protection middleware — populates req.user if token is present, 
 * otherwise continues as guest.
 */
exports.optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null; // Guest state
    return next();
  }

  try {
    // 1. Try JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      return next();
    }
  } catch (err) {
    // Continue to Firebase
  }

  try {
    // 2. Try Firebase
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const user = await User.findOne({ 
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email }
      ]
    });
    
    req.user = user || null;
    return next();
  } catch (err) {
    req.user = null;
    return next();
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
