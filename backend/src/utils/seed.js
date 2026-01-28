const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('../models/Tree');

dotenv.config();

const trees = [
  // --- Environmental Rewards ---
  {
    name: '1 Tree',
    cost: 80,
    description: 'Approx effort: ~1 kg trash. Real-world value: ₹50–70.',
    category: 'trees',
    image: '/uploads/single-tree.png',
    available: true,
    impact: { co2Offset: 20, description: 'Absorbs 20kg CO₂/year' }
  },
  {
    name: '3 Trees Bundle',
    cost: 200,
    description: 'Approx effort: ~2 kg trash. Real-world value: ₹150–180.',
    category: 'bundles',
    image: '/uploads/3-trees.png',
    available: true,
    impact: { co2Offset: 60, description: 'Absorbs 60kg CO₂/year' }
  },
  {
    name: '10 Trees Bundle',
    cost: 550,
    description: 'Approx effort: ~5–6 kg trash. Real-world value: ₹500–600.',
    category: 'bundles',
    image: '/uploads/10-trees.png',
    available: true,
    impact: { co2Offset: 200, description: 'Absorbs 200kg CO₂/year' }
  },

  // --- Public Transport Benefits ---
  {
    name: 'Bus Pass (Single Day)',
    cost: 120,
    description: 'Approx effort: ~1–1.2 kg trash. Real-world value: ₹50–80.',
    category: 'transport',
    image: '/uploads/bus-pass.png',
    available: true
  },
  {
    name: 'Bus Pass (Monthly)',
    cost: 800,
    description: 'Approx effort: ~8 kg trash. Real-world value: ₹700–900.',
    category: 'transport',
    image: '/uploads/bus-pass-monthly.png',
    available: true
  },
  {
    name: 'Metro Pass (Single Day)',
    cost: 200,
    description: 'Approx effort: ~2 kg trash. Real-world value: ₹120–150.',
    category: 'transport',
    image: '/uploads/metro-card.png',
    available: true
  },
  {
    name: 'Metro Pass (Monthly)',
    cost: 1200,
    description: 'Approx effort: ~12 kg trash. Real-world value: ₹1200–1500.',
    category: 'transport',
    image: '/uploads/metro-card-monthly.png',
    available: true
  },

  // --- FASTag Credits ---
  {
    name: 'FASTag Credit ₹100',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash.',
    category: 'transport',
    image: '/uploads/fastag.png',
    available: true
  },
  {
    name: 'FASTag Credit ₹300',
    cost: 300,
    description: 'Approx effort: ~3 kg trash.',
    category: 'transport',
    image: '/uploads/fastag.png',
    available: true
  },
  {
    name: 'FASTag Credit ₹500',
    cost: 500,
    description: 'Approx effort: ~5 kg trash.',
    category: 'transport',
    image: '/uploads/fastag.png',
    available: true
  },

  // --- Physical Goodies ---
  {
    name: 'Reusable Water Bottle',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash. Govt bulk cost: ₹80–120.',
    category: 'goodies',
    image: '/uploads/bottle.png',
    available: true
  },
  {
    name: 'Cloth / Jute Bag',
    cost: 80,
    description: 'Approx effort: ~1 kg trash. Govt bulk cost: ₹40–60.',
    category: 'goodies',
    image: '/uploads/bag.png',
    available: true
  },
  {
    name: 'Stationery Kit',
    cost: 100,
    description: 'Approx effort: ~1 kg trash. Govt bulk cost: ₹70–100.',
    category: 'goodies',
    image: '/uploads/stationery.png',
    available: true
  },
  {
    name: 'Sanitary Kit',
    cost: 100,
    description: 'Gloves, Mask, Sanitizer. Approx effort: ~1 kg trash. Govt bulk cost: ₹60–90.',
    category: 'goodies',
    image: '/uploads/sanitizer.png',
    available: true
  },

  // --- Utility Bill Discounts ---
  {
    name: 'Water Bill Discount ₹100',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash.',
    category: 'utilities',
    image: '/uploads/water.png',
    available: true
  },
  {
    name: 'Electricity Bill Discount ₹200',
    cost: 200,
    description: 'Approx effort: ~2 kg trash.',
    category: 'utilities',
    image: '/uploads/electricity.png',
    available: true
  },
  {
    name: 'Electricity Bill Discount ₹500',
    cost: 500,
    description: 'Approx effort: ~5 kg trash.',
    category: 'utilities',
    image: '/uploads/electricity.png',
    available: true
  },

  // --- Recognition & Motivation ---
  {
    name: 'Digital Certificate',
    cost: 80,
    description: 'Verified Civic Contributor. Approx effort: ~1 kg trash.',
    category: 'recognition',
    image: '/uploads/certificate.png',
    available: true
  },
  {
    name: 'Ward / City Recognition Badge',
    cost: 250,
    description: 'Approx effort: ~2.5 kg trash.',
    category: 'recognition',
    image: '/uploads/badge.png',
    available: true
  },
  {
    name: 'Physical Trophy / Medal',
    cost: 300,
    description: 'Approx effort: ~3 kg trash. Cost to govt: ₹200–300.',
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
