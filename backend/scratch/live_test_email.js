const mongoose = require('mongoose');
require('dotenv').config();

// Define models briefly
const User = require('../src/models/User');
const Submission = require('../src/models/Submission');
const { sendStatusUpdateEmail } = require('../src/utils/mailService');

async function triggerTestEmail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const targetEmail = 'vivek01s1074@gmail.com';
        console.log(`📡 Preparing test email for: ${targetEmail}`);

        // Mock a user object for the email template
        const mockUser = {
            name: 'Vivek Singh',
            email: targetEmail
        };

        // Mock a submission for the email template
        const mockSubmission = {
            type: 'Garbage Collection',
            status: 'verified',
            weight: 25,
            creditsAwarded: 500,
            verificationDetails: {
                notes: 'Excellent work in cleaning up the area!'
            }
        };

        console.log('Triggering live SMTP send...');
        const result = await sendStatusUpdateEmail(mockUser, mockSubmission);
        
        if (result.success) {
            console.log('🎉 LIVE TEST SENT SUCCESSFULLY!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ LIVE TEST FAILED:', result.error);
        }
        
        process.exit();
    } catch (err) {
        console.error('💥 Error in trigger script:', err);
        process.exit(1);
    }
}

triggerTestEmail();
