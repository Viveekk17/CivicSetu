const mongoose = require('mongoose');
require('dotenv').config();

// Define models briefly
const User = require('../src/models/User');
const Submission = require('../src/models/Submission');
const { sendStatusUpdateEmail } = require('../src/utils/mailService');

async function triggerEmail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find a recent submission
        const submission = await Submission.findOne().sort({ createdAt: -1 });
        if (!submission) {
            console.log('No submissions found');
            process.exit(0);
        }

        console.log('Found submission:', submission._id, 'for user:', submission.user);

        const user = await User.findById(submission.user);
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        console.log('Target User Email:', user.email);

        // Manually trigger the status update email logic
        console.log('Triggering email...');
        const result = await sendStatusUpdateEmail(user, submission);
        console.log('Email trigger result:', result);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

triggerEmail();
