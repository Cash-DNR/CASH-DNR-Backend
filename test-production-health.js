// Test production server health and configuration
import fetch from 'node-fetch';

const testProductionHealth = async () => {
  console.log('🏥 Testing PRODUCTION server health...\n');
  
  try {
    // Test basic server response
    const healthCheck = await fetch('https://cash-dnr-backend.onrender.com/api', {
      method: 'GET'
    });
    
    console.log('📊 Health Check Status:', healthCheck.status);
    
    if (healthCheck.ok) {
      const healthData = await healthCheck.json();
      console.log('✅ Server is responding:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('⚠️ Server health check failed');
    }

  } catch (error) {
    console.error('🚨 Production server error:', error.message);
  }
};

testProductionHealth();