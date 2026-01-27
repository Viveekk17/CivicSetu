const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('./src/models/Tree');

dotenv.config();

const trees = [
  // --- Transport ---
  {
    name: 'Metro Pass',
    cost: 500,
    description: 'Weekly metro pass for eco-friendly commuting.',
    category: 'transport',
    impact: { co2Offset: 15, description: 'Saves approx. 15kg CO₂ vs driving' },
    available: true
  },
  {
    name: 'Green Commuter Pass',
    cost: 1000,
    description: 'Monthly unlimited pass for city public transport.',
    category: 'transport',
    impact: { co2Offset: 60, description: 'Saves approx. 60kg CO₂/month' },
    available: true
  },
  {
    name: 'FASTag Credits',
    cost: 200,
    description: '₹200 recharge for your FASTag.',
    category: 'transport',
    impact: { co2Offset: 0, description: 'Efficient travel support' },
    available: true
  },

  // --- Utilities ---
  {
    name: 'Electricity Discount',
    cost: 300,
    description: '10% discount on your next green energy bill.',
    category: 'utilities',
    impact: { co2Offset: 0, description: 'Promotes energy efficiency' },
    available: true
  },
  {
    name: 'Water Bill Discount',
    cost: 300,
    description: '10% discount on water bill for efficient users.',
    category: 'utilities',
    impact: { co2Offset: 0, description: 'Encourages water conservation' },
    available: true
  },

  // --- Goodies ---
  {
    name: 'Eco T-shirt',
    cost: 800,
    description: '100% Organic Cotton T-shirt with EcoTrace logo.',
    category: 'goodies',
    impact: { co2Offset: 5, description: 'Sustainable material production' },
    available: true
  },
  {
    name: 'Metal Water Bottle',
    cost: 600,
    description: 'Durable reusable bottle to reduce plastic use.',
    category: 'goodies',
    impact: { co2Offset: 10, description: 'Prevents single-use plastic waste' },
    available: true
  },

  // --- Environment (Original Trees) ---
  {
    name: 'Oak Tree',
    cost: 500,
    description: 'Supports local biodiversity and provides habitat for wildlife.',
    category: 'trees',
    impact: {
      co2Offset: 22,
      description: 'Absorbs 22kg of CO₂ annually'
    },
    available: true
  },
  {
    name: 'Mangrove',
    cost: 800,
    description: 'Coastal protection expert. Prevents erosion and supports marine life.',
    category: 'trees',
    impact: {
      co2Offset: 40,
      description: 'Absorbs 40kg of CO₂ & protects coastlines'
    },
    available: true
  },
  {
    name: 'Pine Tree',
    cost: 300,
    description: 'Fast-growing conifer that thrives in various climates.',
    category: 'trees',
    impact: {
      co2Offset: 15,
      description: 'Absorbs 15kg of CO₂ annually'
    },
    available: true
  },
  {
    name: 'Forest Package',
    cost: 2000,
    description: '5 native trees bundle for reforestation projects.',
    category: 'bundles',
    impact: {
      co2Offset: 100,
      description: '5 trees absorbing 100kg of CO₂ annually'
    },
    available: true
  },
  {
    name: 'Urban Forest',
    cost: 3500,
    description: '10 trees for city parks and urban green spaces.',
    category: 'bundles',
    impact: {
      co2Offset: 200,
      description: '10 trees creating urban green space'
    },
    available: true
  },
  {
    name: 'Bee Habitat',
    cost: 1200,
    description: 'Support pollinators with native wildflower meadow and bee house.',
    category: 'wildlife',
    impact: {
      co2Offset: 5,
      description: 'Supports 500+ bees and pollinates local plants'
    },
    available: true
  },
  {
    name: 'Bird Sanctuary',
    cost: 1500,
    description: 'Create safe haven for local bird species with nesting boxes.',
    category: 'wildlife',
    impact: {
      co2Offset: 10,
      description: 'Provides habitat for 20+ bird species'
    },
    available: true
  },
  {
    name: '1 Tonne CO₂ Offset',
    cost: 1000,
    description: 'Certified carbon offset credit verified by international standards.',
    category: 'offset',
    impact: {
      co2Offset: 1000,
      description: 'Offsets 1 tonne of CO₂ emissions'
    },
    available: true
  },
  {
    name: '5 Tonne CO₂ Offset',
    cost: 4500,
    description: 'Large certified carbon offset package for major impact.',
    category: 'offset',
    impact: {
      co2Offset: 5000,
      description: 'Offsets 5 tonnes of CO₂ emissions'
    },
    available: true
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
