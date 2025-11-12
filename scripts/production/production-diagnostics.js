// Diagnostic script for production server issues
import fetch from 'node-fetch';

const runDiagnostics = async () => {
  console.log('🔍 Running production server diagnostics...\n');
  
  try {
    // Test 1: Check server health/status
    console.log('1️⃣ Testing server health...');
    try {
      const healthResponse = await fetch('https://cash-dnr-backend.onrender.com/api/health', {
        method: 'GET',
        timeout: 10000
      });
      console.log(`   Status: ${healthResponse.status}`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.text();
        console.log(`   Response: ${healthData}`);
      }
    } catch (healthError) {
      console.log(`   ❌ Health check failed: ${healthError.message}`);
    }

    // Test 2: Check any other basic endpoint
    console.log('\n2️⃣ Testing basic API endpoint...');
    try {
      const basicResponse = await fetch('https://cash-dnr-backend.onrender.com/', {
        method: 'GET',
        timeout: 10000
      });
      console.log(`   Status: ${basicResponse.status}`);
      const basicText = await basicResponse.text();
      console.log(`   Response: ${basicText.substring(0, 200)}${basicText.length > 200 ? '...' : ''}`);
    } catch (basicError) {
      console.log(`   ❌ Basic endpoint failed: ${basicError.message}`);
    }

    // Test 3: Try the registration endpoint with minimal data
    console.log('\n3️⃣ Testing registration endpoint...');
    try {
      const testPayload = {
        idNumber: '8012094321085',
        contactInfo: {
          email: 'test' + Date.now() + '@example.com',
          phone: '+27123456789'
        },
        homeAddress: {
          streetAddress: 'Test Street',
          town: 'Test Town',
          city: 'Test City',
          province: 'Test Province',
          postalCode: '1234'
        },
        password: 'TestPassword123'
      };

      const registerResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        timeout: 15000
      });

      console.log(`   Status: ${registerResponse.status}`);
      const registerData = await registerResponse.text();
      console.log(`   Response: ${registerData}`);

    } catch (registerError) {
      console.log(`   ❌ Registration failed: ${registerError.message}`);
    }

  } catch (error) {
    console.error('🚨 Diagnostic error:', error.message);
  }
};

runDiagnostics();