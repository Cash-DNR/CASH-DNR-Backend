// Test if the production environment can see our variables
import fetch from 'node-fetch';

const testProductionEnvironment = async () => {
  console.log('🔍 Testing Production Environment Variables Access...\n');
  
  // Try to hit a simple endpoint that might reveal environment info
  const endpoints = [
    '/',
    '/health', 
    '/api/users'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: https://cash-dnr-backend.onrender.com${endpoint}`);
      const response = await fetch(`https://cash-dnr-backend.onrender.com${endpoint}`, {
        method: 'GET',
        timeout: 10000
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        
        // Look for any clues about the environment
        if (data.includes('environment') || data.includes('NODE_ENV') || data.includes('database')) {
          console.log('🔍 Found environment-related info in response!');
        }
      }
      console.log('---');
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log('---');
    }
  }
  
  // Test if we can get any environment info by trying to trigger a specific error
  console.log('\n🔍 Testing with malformed request to see error details...');
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' }), // This should trigger validation error
      timeout: 15000
    });
    
    console.log(`Malformed request status: ${response.status}`);
    const errorData = await response.text();
    console.log(`Error response: ${errorData}`);
    
  } catch (error) {
    console.log(`Malformed request error: ${error.message}`);
  }
};

testProductionEnvironment();