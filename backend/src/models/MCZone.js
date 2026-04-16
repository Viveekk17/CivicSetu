const mongoose = require('mongoose');

const mcZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a zone name'],
    unique: true,
    trim: true
  },
  criticality: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high', 'critical'],
    default: 'low'
  },
  district: {
    type: String,
    required: [true, 'Please provide a district']
  },
  // Simple representation for now: a point and radius or just name match
  // For production, this would be a polygon
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  radius: {
    type: Number, // in meters
    default: 1000
  }
}, {
  timestamps: true
});

// Define 2dsphere index for geospatial queries
mcZoneSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MCZone', mcZoneSchema);
