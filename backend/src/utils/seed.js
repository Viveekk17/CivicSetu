const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('../models/Tree');

dotenv.config();

const trees = [
  {
    name: 'Single Tree',
    cost: 100,
    description: 'Plant one native tree. Perfect for starting your green journey.',
    category: 'trees',
    image: '/uploads/single-tree.png',
    available: true,
    impact: {
      co2Offset: 20,
      description: 'Absorbs approximately 20kg of CO2 per year'
    }
  },
  {
    name: '3 Trees Package',
    cost: 250,
    description: 'Bundle of 3 native trees. Great value for small green spaces.',
    category: 'bundles',
    image: '/uploads/3-trees.png',
    available: true,
    impact: {
      co2Offset: 60,
      description: 'Combined CO2 absorption of approximately 60kg per year'
    }
  },
  {
    name: '10 Trees Package',
    cost: 750,
    description: 'Bundle of 10 native trees. Ideal for creating a mini forest.',
    category: 'bundles',
    image: '/uploads/10-trees.png',
    available: true,
    impact: {
      co2Offset: 200,
      description: 'Combined CO2 absorption of approximately 200kg per year'
    }
  },
  {
    name: '50 Trees Package',
    cost: 3000,
    description: 'Large bundle of 50 native trees. Transform an entire area into a forest.',
    category: 'bundles',
    image: '/uploads/50-trees.png',
    available: true,
    impact: {
      co2Offset: 1000,
      description: 'Combined CO2 absorption of approximately 1000kg (1 tonne) per year'
    }
  },
  // Transport Items
  {
    name: 'Public Transport Pass',
    cost: 500,
    description: 'Weekly pass for city bus and metro services.',
    category: 'transport',
    image: '/uploads/bus-pass.png',
    available: true
  },
  {
    name: 'Metro Card Top-up',
    cost: 200,
    description: 'Add credits to your metro card for seamless travel.',
    category: 'transport',
    image: '/uploads/metro-card.png',
    available: true
  },
  // Utilities
  {
    name: 'Electricity Bill Coupon',
    cost: 1000,
    description: 'Get a discount coupon for your next electricity bill.',
    category: 'utilities',
    image: '/uploads/electricity.png',
    available: true
  },
  {
    name: 'Water Bill Credit',
    cost: 800,
    description: 'Credit towards your municipal water bill.',
    category: 'utilities',
    image: '/uploads/water.png',
    available: true
  },
  // Goodies
  {
    name: 'Eco-Friendly Water Bottle',
    cost: 400,
    description: 'Reusable stainless steel water bottle.',
    category: 'goodies',
    image: '/uploads/bottle.png',
    available: true
  },
  {
    name: 'Organic Cotton T-Shirt',
    cost: 600,
    description: '100% organic cotton t-shirt with EcoTrace logo.',
    category: 'goodies',
    image: '/uploads/tshirt.png',
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
