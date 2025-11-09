// Simple database connection endpoint to add temporarily
// Add this to your auth.js or create a separate route file

import express from 'express';
const router = express.Router();

// Temporary endpoint to test database connection
router.get('/debug/db-test', async (req, res) => {
  try {
    // Import sequelize here to avoid circular imports
    const { sequelize } = await import('../config/database.js');
    
    // Test basic connection
    await sequelize.authenticate();
    
    // Test simple query
    const [results] = await sequelize.query('SELECT NOW() as current_time;');
    
    // Test if we can access User model
    const User = (await import('../models/User.js')).default;
    const userCount = await User.count();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        connected: true,
        currentTime: results[0].current_time,
        userCount: userCount,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        prodDbHost: process.env.PROD_DB_HOST ? 'SET' : 'NOT SET'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      details: {
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        prodDbHost: process.env.PROD_DB_HOST ? 'SET' : 'NOT SET',
        errorType: error.constructor.name
      }
    });
  }
});

export default router;