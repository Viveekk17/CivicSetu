const mongoose = require('mongoose');
require('dotenv').config();

// Define models briefly
const UserSchema = new mongoose.Schema({ 
    role: String,
    impact: { treesPlanted: Number }
});
const SubmissionSchema = new mongoose.Schema({ status: String });
const TransactionSchema = new mongoose.Schema({ type: String, amount: Number });

const User = mongoose.model('User', UserSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userCount = await User.countDocuments({ role: { $ne: 'admin' } });
        const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null, $ne: '' } });
        const subCount = await Submission.countDocuments();
        
        const impact = await User.aggregate([
            { $group: { _id: null, totalTrees: { $sum: "$impact.treesPlanted" } } }
        ]);

        const credits = await Transaction.aggregate([
            { $match: { type: 'redeemed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        console.log('--- DB STATS ---');
        console.log('Total Users (non-admin):', userCount);
        console.log('Users with Email:', usersWithEmail);
        console.log('Total Submissions:', subCount);
        console.log('Total Impact (Trees):', impact[0]?.totalTrees || 0);
        console.log('Total Redeemed Credits:', credits[0]?.total || 0);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
