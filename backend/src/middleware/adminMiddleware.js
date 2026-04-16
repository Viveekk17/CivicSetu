const jwt = require('jsonwebtoken');
const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        // Auth middleware usually runs before this and sets req.user
        // But let's double check just in case, or if used standalone (which it shouldn't be)

        if (!req.user) {
            // If auth middleware didn't run, we need to verify token here manually or return error
            // Assuming 'protect' middleware is always used before 'admin'
            return res.status(401).json({ success: false, message: 'Not authorized, no user found' });
        }

        // Get user from DB to check role (req.user from middleware might be lean)
        const user = await User.findById(req.user.id);

        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(401).json({ success: false, message: 'Not authorized as an admin' });
        }
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: 'Not authorized as an admin' });
    }
};

module.exports = { admin };
