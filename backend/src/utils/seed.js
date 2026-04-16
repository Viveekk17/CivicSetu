const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('../models/Tree');

dotenv.config();

const trees = [
  // --- Environmental Rewards ---
  {
    name: 'Single Sapling',
    cost: 90,
    description: 'Approx effort: ~1 kg plastic/hazardous. Real-world value: ₹50–70.',
    category: 'trees',
    image: '/uploads/single-tree.png',
    available: true,
    impact: { co2Offset: 20, description: 'Absorbs 20kg CO₂/year' }
  },
  {
    name: 'Nature Trio (3 Trees)',
    cost: 250,
    description: 'Approx effort: ~2.5 kg mixed waste. Real-world value: ₹150–180.',
    category: 'bundles',
    image: '/uploads/3-trees.png',
    available: true,
    impact: { co2Offset: 60, description: 'Absorbs 60kg CO₂/year' }
  },
  {
    name: 'Small Forest (10 Trees)',
    cost: 750,
    description: 'Approx effort: ~7-8 kg waste. Real-world value: ₹500–600.',
    category: 'bundles',
    image: '/uploads/10-trees.png',
    available: true,
    impact: { co2Offset: 200, description: 'Absorbs 200kg CO₂/year' }
  },

  // --- Public Transport Benefits ---
  {
    name: 'Day Bus Pass',
    cost: 100,
    description: 'Unlimited travel for 1 day. Real-world value: ₹50–80.',
    category: 'transport',
    image: '/uploads/bus-pass.png',
    available: true
  },
  {
    name: 'Monthly Bus Pass',
    cost: 950,
    description: 'Full monthly commute credits. Real-world value: ₹700–900.',
    category: 'transport',
    image: '/uploads/bus-pass-monthly.png',
    available: true
  },
  {
    name: 'Metro Day Pass',
    cost: 150,
    description: 'Fast transit for the daily commuter. Real-world value: ₹120–150.',
    category: 'transport',
    image: '/uploads/metro-card.png',
    available: true
  },

  // --- FASTag Credits ---
  {
    name: 'FASTag ₹100 Top-up',
    cost: 110,
    description: 'Toll plaza credits for your vehicle.',
    category: 'transport',
    image: '/uploads/fastag.png',
    available: true
  },
  {
    name: 'FASTag ₹500 Top-up',
    cost: 550,
    description: 'Premium toll credits package.',
    category: 'transport',
    image: '/uploads/fastag.png',
    available: true
  },

  // --- Physical Goodies ---
  {
    name: 'Stainless Steel Bottle',
    cost: 200,
    description: 'Eco-friendly alternative to plastic.',
    category: 'goodies',
    image: '/uploads/bottle.png',
    available: true
  },
  {
    name: 'Premium Jute Bag',
    cost: 120,
    description: 'Sturdy shopping companion.',
    category: 'goodies',
    image: '/uploads/bag.png',
    available: true
  },

  // --- Utility Bill Discounts ---
  {
    name: 'Water Bill Credit ₹100',
    cost: 100,
    description: 'Applied directly to your Municipal water bill.',
    category: 'utilities',
    image: '/uploads/water.png',
    available: true
  },
  {
    name: 'Electricity Rebate ₹250',
    cost: 250,
    description: 'Municipal power corporation discount.',
    category: 'utilities',
    image: '/uploads/electricity.png',
    available: true
  },
  {
    name: 'Property Tax Waiver ₹500',
    cost: 450,
    description: 'Annual property tax incentive for green citizens.',
    category: 'utilities',
    image: '/uploads/tax.png',
    available: true
  },

  // --- Recognition ---
  {
    name: 'Digital Green Hero Cert',
    cost: 50,
    description: 'Shareable certificate of your civic contribution.',
    category: 'recognition',
    image: '/uploads/certificate.png',
    available: true
  },
  {
    name: 'Ward Excellence Medal',
    cost: 350,
    description: 'Physical recognition from your local Ward Councilor.',
    category: 'recognition',
    image: '/uploads/trophy.png',
    available: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing trees
    await Tree.deleteMany();
    console.log('🗑️  Cleared existing trees');

    // Insert sample trees
    await Tree.insertMany(trees);
    console.log(`🌳 Seeded ${trees.length} trees successfully`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
