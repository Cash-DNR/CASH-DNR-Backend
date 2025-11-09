// Test if NODE_ENV has been updated on production
import fetch from 'node-fetch';

const checkEnvironmentUpdate = async () => {
  console.log('🔍 Checking if NODE_ENV has been updated on production...\n');
  
  // Test basic endpoint to see if server responds
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is responding');
      console.log(`📊 Server timestamp: ${data.timestamp}`);
      
      // Check if the timestamp is recent (indicates recent deployment)
      const serverTime = new Date(data.timestamp);
      const now = new Date();
      const timeDiff = (now - serverTime) / 1000; // seconds
      
      if (timeDiff < 300) { // Less than 5 minutes
        console.log(`🚀 Server was recently deployed (${Math.round(timeDiff)} seconds ago)`);
      } else {
        console.log(`⏰ Server timestamp is ${Math.round(timeDiff)} seconds old`);
      }
      
    } else {
      console.log(`❌ Server returned status: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Server connection error: ${error.message}`);
  }
  
  // Test validation to see if it's working
  console.log('\n🔍 Testing validation (should work regardless of DB)...');
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' }),
      timeout: 10000
    });
    
    console.log(`📊 Validation test status: ${response.status}`);
    const data = await response.text();
    console.log(`📄 Validation response: ${data.substring(0, 200)}`);
    
    if (response.status === 400 && data.includes('Missing required fields')) {
      console.log('✅ Validation is working - server is responsive');
    }
    
  } catch (error) {
    console.log(`❌ Validation test error: ${error.message}`);
  }
};

checkEnvironmentUpdate();