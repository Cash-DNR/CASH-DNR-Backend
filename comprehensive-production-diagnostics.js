// Comprehensive production environment diagnostics
import fetch from 'node-fetch';

const diagnoseProductionEnvironment = async () => {
  console.log('🔍 Comprehensive Production Environment Diagnostics\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    // Test 1: Basic server connectivity
    console.log('1️⃣ Testing basic server connectivity...');
    const basicResponse = await fetch('https://cash-dnr-backend.onrender.com/', {
      method: 'GET',
      timeout: 10000
    });
    console.log(`   Status: ${basicResponse.status}`);
    
    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      console.log(`   Server timestamp: ${basicData.timestamp}`);
      console.log(`   Version: ${basicData.version}`);
    }
    
    // Test 2: Check if there's a health/status endpoint
    console.log('\n2️⃣ Testing health endpoints...');
    const healthEndpoints = ['/health', '/api/health', '/status', '/api/status'];
    
    for (const endpoint of healthEndpoints) {
      try {
        const healthResponse = await fetch(`https://cash-dnr-backend.onrender.com${endpoint}`, {
          method: 'GET',
          timeout: 5000
        });
        console.log(`   ${endpoint}: Status ${healthResponse.status}`);
        
        if (healthResponse.ok) {
          const healthText = await healthResponse.text();
          console.log(`      Response: ${healthText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ${endpoint}: Not available`);
      }
    }
    
    // Test 3: Test different registration scenarios
    console.log('\n3️⃣ Testing registration scenarios...');
    
    const testCases = [
      {
        name: 'Minimal payload',
        payload: {
          idNumber: '8001014321085',
          contactInfo: { email: 'min' + Date.now() + '@test.com', phone: '+27123456789' },
          homeAddress: { streetAddress: 'Test', town: 'Test', city: 'Test', province: 'Test', postalCode: '1234' },
          password: 'Test123'
        }
      },
      {
        name: 'Different ID number',
        payload: {
          idNumber: '9001014321085',
          contactInfo: { email: 'diff' + Date.now() + '@test.com', phone: '+27987654321' },
          homeAddress: { streetAddress: 'Different', town: 'Different', city: 'Different', province: 'Different', postalCode: '5678' },
          password: 'Different123'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      try {
        const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.payload),
          timeout: 20000
        });
        
        console.log(`   Status: ${response.status}`);
        
        const responseText = await response.text();
        console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
        
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // Test 4: Test other API endpoints
    console.log('\n4️⃣ Testing other API endpoints...');
    const otherEndpoints = ['/api/auth', '/api/users', '/api/upload'];
    
    for (const endpoint of otherEndpoints) {
      try {
        const response = await fetch(`https://cash-dnr-backend.onrender.com${endpoint}`, {
          method: 'GET',
          timeout: 5000
        });
        console.log(`   ${endpoint}: Status ${response.status}`);
      } catch (error) {
        console.log(`   ${endpoint}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('🚨 Diagnostic error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY:');
  console.log('• If basic connectivity works but registration fails = Database connection issue');
  console.log('• If all endpoints fail = Server is down');
  console.log('• If some endpoints work = Specific route/middleware issue');
  console.log('\n💡 RECOMMENDED ACTIONS:');
  console.log('1. Restart the Render.com service (Manual Deploy)');
  console.log('2. Check Render.com service logs for detailed errors');
  console.log('3. Verify environment variables are set correctly');
  console.log('4. Consider recreating the database connection');
};

diagnoseProductionEnvironment();