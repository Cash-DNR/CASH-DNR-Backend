// Temporary debug route to add to your server for troubleshooting
// Add this to your auth.js route file temporarily

import express from 'express';
const router = express.Router();

// Temporary debug endpoint to check environment variables
router.get('/debug/env', (req, res) => {
  try {
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      PROD_DB_HOST_SET: !!process.env.PROD_DB_HOST,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      PORT: process.env.PORT,
      timestamp: new Date().toISOString(),
      // Show first 50 chars of DATABASE_URL for verification
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    };
    
    res.json({
      success: true,
      message: 'Environment Debug Info',
      data: envInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;