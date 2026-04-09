const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
        admin.password = 'admin123';
        await admin.save();
        console.log('Password successfully reset to admin123 for email: ' + admin.email);
    } else {
        console.log('No admin found.');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetAdminPassword();
