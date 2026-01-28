const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('./src/models/Tree');

dotenv.config();

const trees = [
  // --- Environmental Rewards ---
  {
    name: '1 Tree',
    cost: 80,
    description: 'Approx effort: ~1 kg trash. Real-world value: ₹50–70.',
    category: 'trees',
    available: true,
    impact: { co2Offset: 20, description: 'Absorbs 20kg CO₂/year' }
  },
  {
    name: '3 Trees Bundle',
    cost: 200,
    description: 'Approx effort: ~2 kg trash. Real-world value: ₹150–180.',
    category: 'bundles',
    available: true,
    impact: { co2Offset: 60, description: 'Absorbs 60kg CO₂/year' }
  },
  {
    name: '10 Trees Bundle',
    cost: 550,
    description: 'Approx effort: ~5–6 kg trash. Real-world value: ₹500–600.',
    category: 'bundles',
    available: true,
    impact: { co2Offset: 200, description: 'Absorbs 200kg CO₂/year' }
  },

  // --- Public Transport Benefits ---
  {
    name: 'Bus Pass (Single Day)',
    cost: 120,
    description: 'Approx effort: ~1–1.2 kg trash. Real-world value: ₹50–80.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 5, description: 'Saves approx. 5kg CO₂ vs driving' }
  },
  {
    name: 'Bus Pass (Monthly)',
    cost: 800,
    description: 'Approx effort: ~8 kg trash. Real-world value: ₹700–900.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 150, description: 'Saves approx. 150kg CO₂/month' }
  },
  {
    name: 'Metro Pass (Single Day)',
    cost: 200,
    description: 'Approx effort: ~2 kg trash. Real-world value: ₹120–150.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 15, description: 'Saves approx. 15kg CO₂ vs driving' }
  },
  {
    name: 'Metro Pass (Monthly)',
    cost: 1200,
    description: 'Approx effort: ~12 kg trash. Real-world value: ₹1200–1500.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 60, description: 'Saves approx. 60kg CO₂/month' }
  },

  // --- FASTag Credits ---
  {
    name: 'FASTag Credit ₹100',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 0, description: 'Efficient travel support' }
  },
  {
    name: 'FASTag Credit ₹300',
    cost: 300,
    description: 'Approx effort: ~3 kg trash.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 0, description: 'Efficient travel support' }
  },
  {
    name: 'FASTag Credit ₹500',
    cost: 500,
    description: 'Approx effort: ~5 kg trash.',
    category: 'transport',
    available: true,
    impact: { co2Offset: 0, description: 'Efficient travel support' }
  },

  // --- Physical Goodies ---
  {
    name: 'Reusable Water Bottle',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash. Govt bulk cost: ₹80–120.',
    category: 'goodies',
    available: true,
    impact: { co2Offset: 1, description: 'Prevents single-use plastic waste' }
  },
  {
    name: 'Cloth / Jute Bag',
    cost: 80,
    description: 'Approx effort: ~1 kg trash. Govt bulk cost: ₹40–60.',
    category: 'goodies',
    available: true,
    impact: { co2Offset: 1, description: 'Reduces plastic bag usage' }
  },
  {
    name: 'Stationery Kit',
    cost: 100,
    description: 'Approx effort: ~1 kg trash. Govt bulk cost: ₹70–100.',
    category: 'goodies',
    available: true,
    impact: { co2Offset: 1, description: 'Sustainable materials' }
  },
  {
    name: 'Sanitary Kit',
    cost: 100,
    description: 'Gloves, Mask, Sanitizer. Approx effort: ~1 kg trash. Govt bulk cost: ₹60–90.',
    category: 'goodies',
    available: true,
    impact: { co2Offset: 0, description: 'Hygiene support' }
  },

  // --- Utility Bill Discounts ---
  {
    name: 'Water Bill Discount ₹100',
    cost: 120,
    description: 'Approx effort: ~1.2 kg trash.',
    category: 'utilities',
    available: true,
    impact: { co2Offset: 0, description: 'Encourages water conservation' }
  },
  {
    name: 'Electricity Bill Discount ₹200',
    cost: 200,
    description: 'Approx effort: ~2 kg trash.',
    category: 'utilities',
    available: true,
    impact: { co2Offset: 0, description: 'Promotes energy efficiency' }
  },
  {
    name: 'Electricity Bill Discount ₹500',
    cost: 500,
    description: 'Approx effort: ~5 kg trash.',
    category: 'utilities',
    available: true,
    impact: { co2Offset: 0, description: 'Promotes energy efficiency' }
  },

  // --- Recognition & Motivation ---
  {
    name: 'Digital Certificate',
    cost: 80,
    description: 'Verified Civic Contributor. Approx effort: ~1 kg trash.',
    category: 'recognition',
    available: true,
    impact: { co2Offset: 0, description: 'Social Impact Recognition' }
  },
  {
    name: 'Ward / City Recognition Badge',
    cost: 250,
    description: 'Approx effort: ~2.5 kg trash.',
    category: 'recognition',
    available: true,
    impact: { co2Offset: 0, description: 'Civic Leadership' }
  },
  {
    name: 'Physical Trophy / Medal',
    cost: 300,
    description: 'Approx effort: ~3 kg trash. Cost to govt: ₹200–300.',
    category: 'recognition',
    available: true,
    impact: { co2Offset: 0, description: 'Outstanding Contribution' }
  }
];

const seedTrees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing trees
    await Tree.deleteMany({});
    console.log('Cleared existing trees');

    // Insert new trees
    await Tree.insertMany(trees);
    console.log('✓ Successfully seeded', trees.length, 'trees');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding trees:', error);
    process.exit(1);
  }
};

seedTrees();
