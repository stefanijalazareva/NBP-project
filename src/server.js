const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');

// Import routes
const healthRoutes = require('./routes/health');
const ingestRoutes = require('./routes/ingest');
const queriesRoutes = require('./routes/queries');
const benchmarkRoutes = require('./routes/benchmarks');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const performanceRoutes = require('./routes/performance');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/ingest', ingestRoutes);
app.use('/queries', queriesRoutes);
app.use('/benchmarks', benchmarkRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/performance', performanceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IMDB User Reviews API',
    version: '1.0.0',
    endpoints: {
      reviews: '/api/v1/reviews',
      analytics: '/api/v1/analytics',
      performance: '/api/v1/performance',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});
