// Create a simple endpoint to check environment variables on production
// This will help us see what the production server actually sees

const express = require('express');
const app = express();

// Simple environment check endpoint
app.get('/debug/env', (req, res) => {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    PROD_DB_HOST: process.env.PROD_DB_HOST ? '***SET***' : 'NOT SET',
    PROD_DB_PORT: process.env.PROD_DB_PORT,
    PROD_DB_NAME: process.env.PROD_DB_NAME ? '***SET***' : 'NOT SET',
    PROD_DB_USER: process.env.PROD_DB_USER ? '***SET***' : 'NOT SET',
    PROD_DB_PASSWORD: process.env.PROD_DB_PASSWORD ? '***SET***' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'NOT SET',
    PORT: process.env.PORT,
    DEV_DB_HOST: process.env.DEV_DB_HOST ? '***SET***' : 'NOT SET',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Environment Variables Check',
    data: envInfo
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Check environment at: /debug/env`);
});

module.exports = app;