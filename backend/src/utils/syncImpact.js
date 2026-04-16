const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Submission = require('../models/Submission');

dotenv.config();

const syncImpact = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const users = await User.find({});
        console.log(`Doing sync for ${users.length} users...`);

        for (const user of users) {
            // 1. Calculate Pollution Saved from Verified Submissions
            const submissions = await Submission.find({
                user: user._id,
                status: 'verified'
            });

            const totalPollution = submissions.reduce((sum, s) => {
                // Use verified trashWeight, fallback to estimated weight
                const weight = s.verificationDetails?.trashWeight || s.weight || 0;
                return sum + weight;
            }, 0);

            // 2. Calculate Trees Planted from Transactions
            const treeTransactions = await Transaction.find({
                user: user._id,
                type: 'redeemed'
            }).populate('metadata.treeId');

            let totalTrees = 0;

            for (const tx of treeTransactions) {
                // Check metadata first
                const category = tx.metadata?.category || 'unknown';
                const name = tx.metadata?.treeName || tx.description || '';

                if (['trees', 'bundles', 'wildlife', 'offset'].includes(category)) {
                    let count = 1;

                    // Check for bundles in name
                    if (category === 'bundles' || name.includes('Package') || name.includes('Bundle')) {
                        const match = name.match(/(\d+)\s+Trees/i);
                        if (match) {
                            count = parseInt(match[1]);
                        } else if (name.includes('Forest')) {
                            count = 5; // Legacy forest package
                        } else if (name.includes('Urban')) {
                            count = 10; // Legacy urban forest
                        } else {
                            count = 10; // Default bundle
                        }
                    }

                    totalTrees += count;
                }
            }

            // Update User
            user.impact = {
                pollutionSaved: totalPollution,
                treesPlanted: totalTrees
            };

            await user.save();
            console.log(`Synced User: ${user.name} | Trees: ${totalTrees} | Waste: ${totalPollution}kg`);
        }

        console.log('✅ Sync Completed Successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync Error:', error);
        process.exit(1);
    }
};

syncImpact();
