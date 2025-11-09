// Test to isolate where the 500 error is happening in the registration process
import fetch from 'node-fetch';

const testRegistrationSteps = async () => {
  console.log('🔍 Testing registration process step by step...\n');
  
  // Test 1: Minimal valid payload
  console.log('1️⃣ Testing with minimal valid payload...');
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: '8001014321085', // Different ID to avoid conflicts
        contactInfo: {
          email: 'debug' + Date.now() + '@test.com',
          phone: '+27123456789'
        },
        homeAddress: {
          streetAddress: 'Test St',
          town: 'Test',
          city: 'Test',
          province: 'Test',
          postalCode: '1234'
        },
        password: 'Test123'
      }),
      timeout: 60000 // Longer timeout to see if it's a timeout issue
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Response: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Try with a different ID number format
  console.log('\n2️⃣ Testing with different ID number...');
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: '9001014321085', // Different birth year
        contactInfo: {
          email: 'debug2' + Date.now() + '@test.com',
          phone: '+27987654321'
        },
        homeAddress: {
          streetAddress: 'Different St',
          town: 'Different',
          city: 'Different',
          province: 'Different',
          postalCode: '5678'
        },
        password: 'Different123'
      }),
      timeout: 60000
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Response: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Check if it's specifically the Home Affairs API causing issues
  console.log('\n3️⃣ Testing Home Affairs API directly...');
  try {
    const response = await fetch('https://cash-dnr-api.onrender.com/home-affairs/citizens/8001014321085', {
      method: 'GET',
      timeout: 30000
    });
    
    console.log(`   Home Affairs API Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Home Affairs Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
    
  } catch (error) {
    console.log(`   Home Affairs API Error: ${error.message}`);
  }
};

testRegistrationSteps();