const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tree = require('../models/Tree');

dotenv.config();

const trees = [
  {
    name: 'Oak Tree',
    cost: 500,
    description: 'Strong and majestic oak tree. Supports local biodiversity and provides excellent shade.',
    category: 'trees',
    image: '/uploads/oak-tree.png',
    impact: {
      co2Offset: 21,
      description: 'Absorbs approximately 21kg of CO2 per year'
    }
  },
  {
    name: 'Mangrove',
    cost: 1800,
    description: 'Coastal protection expert. Helps prevent soil erosion and provides marine habitat.',
    category: 'trees',
    image: '/uploads/mangrove.png',
    impact: {
      co2Offset: 40,
      description: 'Absorbs up to 40kg of CO2 per year and protects coastlines'
    }
  },
  {
    name: 'Pine Tree',
    cost: 400,
    description: 'Fast-growing evergreen that thrives in various climates.',
    category: 'trees',
    image: '/uploads/pine-tree.png',
    impact: {
      co2Offset: 13,
      description: 'Absorbs approximately 13kg of CO2 per year'
    }
  },
  {
    name: 'Forest Package',
    cost: 2000,
    description: '5 native trees bundle for mixed forest creation.',
    category: 'bundles',
    image: '/uploads/forest-package.png',
    impact: {
      co2Offset: 100,
      description: 'Combined CO2 absorption of approximately 100kg per year'
    }
  },
  {
    name: 'Urban Forest',
    cost: 3500,
    description: '10 trees specially selected for city parks and urban areas.',
    category: 'bundles',
    image: '/uploads/urban-forest.png',
    impact: {
      co2Offset: 200,
      description: 'Creates green spaces and absorbs 200kg of CO2 per year'
    }
  },
  {
    name: 'Bee Habitat',
    cost: 1200,
    description: 'Support pollinators with flowering plants and bee-friendly environment.',
    category: 'wildlife',
    image: '/uploads/bee-habitat.png',
    impact: {
      co2Offset: 5,
      description: 'Supports ecosystem and absorbs 5kg of CO2 per year'
    }
  },
  {
    name: '1 Tonne CO2 Offset',
    cost: 1000,
    description: 'Certified carbon offset credit equivalent to 1 tonne of CO2.',
    category: 'offset',
    image: '/uploads/co2-offset.png',
    impact: {
      co2Offset: 1000,
      description: 'Offsets 1000kg (1 tonne) of carbon emissions'
    }
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
