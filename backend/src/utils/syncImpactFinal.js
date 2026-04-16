const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Submission = require('../models/Submission');

dotenv.config();

const syncImpactFinal = async () => {
    try {
        // 1. Connect
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // 2. Processing
        const users = await User.find({});
        console.log(`Processing ${users.length} users...`);

        for (const user of users) {
            // --- Calculate Pollution (from Submissions) ---
            const submissions = await Submission.find({
                user: user._id,
                status: 'verified'
            });

            const totalPollution = submissions.reduce((sum, s) => {
                // Prefer verification details, fallback to estimated weight
                const weight = s.verificationDetails?.trashWeight || s.weight || 0;
                return sum + weight;
            }, 0);

            // --- Calculate Trees (from Transactions) ---
            // We rely on description because Tree docs might have been deleted by seeding
            const transactions = await Transaction.find({
                user: user._id,
                type: 'redeemed'
            });

            let totalTrees = 0;

            for (const tx of transactions) {
                const desc = tx.description || '';

                // Logic to determine if it was a tree/environmental redemption
                let isEnvironmental = false;
                let count = 0;

                // 1. Check for known environmental keywords
                if (desc.includes('Tree') || desc.includes('Forest') || desc.includes('Mangrove') ||
                    desc.includes('Habitat') || desc.includes('Offset') || desc.includes('Bundle')) {
                    isEnvironmental = true;
                    count = 1; // Default
                }

                // 2. Handle Packages/Bundles counts
                if (isEnvironmental) {
                    // Check for "X Trees Package" or "X Trees"
                    const numberMatch = desc.match(/(\d+)\s+Trees/i);
                    if (numberMatch) {
                        count = parseInt(numberMatch[1]);
                    } else if (desc.includes('Forest Package')) {
                        count = 5;
                    } else if (desc.includes('Urban Forest')) {
                        count = 10;
                    }
                    // "Single Tree", "Oak Tree" etc remain 1
                }

                if (isEnvironmental) {
                    totalTrees += count;
                    // console.log(`  + Found: "${desc}" -> ${count} trees`);
                }
            }

            // --- Update User ---
            if (user.impact?.pollutionSaved !== totalPollution || user.impact?.treesPlanted !== totalTrees) {
                user.impact = {
                    pollutionSaved: totalPollution,
                    treesPlanted: totalTrees
                };
                await user.save();
                console.log(`✅ Synced ${user.name}: ${totalTrees} trees, ${totalPollution}kg waste`);
            } else {
                console.log(`✓ ${user.name} already in sync`);
            }
        }

        console.log('✅ All users synced successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync Error:', error);
        process.exit(1);
    }
};

syncImpactFinal();
