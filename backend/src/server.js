const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Frontend URL from environment
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const treeRoutes = require('./routes/treeRoutes');
const redeemRoutes = require('./routes/redeemRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EcoTrace-AI API is running' });
});

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
