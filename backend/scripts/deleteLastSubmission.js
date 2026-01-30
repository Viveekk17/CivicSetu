const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Submission = require('../src/models/Submission');
const User = require('../src/models/User');

// Load env vars
dotenv.config({ path: '../.env' });

const deleteLastSubmission = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Connected to MongoDB');

        // Find last submission
        const lastSubmission = await Submission.findOne().sort({ createdAt: -1 });

        if (!lastSubmission) {
            console.log('❌ No submissions found.');
            process.exit(0);
        }

        console.log(`🗑️  Deleting submission: ${lastSubmission._id}`);
        console.log(`   Type: ${lastSubmission.type}`);
        console.log(`   Date: ${lastSubmission.createdAt}`);

        // Delete it
        await Submission.findByIdAndDelete(lastSubmission._id);

        console.log('✅ Submission deleted successfully!');

        // Optional: Revert user credits if needed, but for simple testing just deleting the sub is usually enough to clear the hash check.
        // Hash check is against Submission collection.

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

deleteLastSubmission();
