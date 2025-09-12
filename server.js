/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { sequelize } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Import routes
import profileRoutes from './src/routes/profile.js';
import businessRoutes from './src/routes/business.js';
import transactionRoutes from './src/routes/transactions.js';

// API Routes
app.use('/api/register', authRoutes);
app.use('/api/register/business', businessRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', profileRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Cash DNR Backend API',
    version: '1.0.0',
    endpoints: {
      register: '/api/register',
      citizens: '/api/citizens',
      businesses: '/api/businesses',
      users: '/api/users',
      transactions: '/api/transactions'
    }
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database
    const environment = (process.env.NODE_ENV || 'development').trim().toLowerCase();
    if (environment === 'development') {
      // Force sync in development to update table structure
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized with table alterations.');
    } else {
      await sequelize.sync();
      console.log('✅ Database models synchronized.');
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export app for testing
export default app;

// Start the server
startServer();
