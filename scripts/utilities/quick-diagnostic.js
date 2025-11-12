/**
 * Quick diagnostic script to test server components
 */

import axios from 'axios';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connectivity...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 15000 });
    console.log('✅ Database connection:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testSimpleEndpoint() {
  console.log('🔍 Testing simple endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/`, { timeout: 15000 });
    console.log('✅ Simple endpoint:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Simple endpoint failed:', error.message);
    return false;
  }
}

async function testVerifyEndpoint() {
  console.log('🔍 Testing verify-id endpoint with minimal data...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/verify-id`, {
      idNumber: '8203141234089'
    }, { 
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Verify endpoint response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Verify endpoint failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    return false;
  }
}

async function testRegistrationValidation() {
  console.log('🔍 Testing registration validation...');
  try {
    // Test with missing fields to ensure validation works
    const response = await axios.post(`${BASE_URL}/api/auth/citizen`, {
      // Missing required fields
    }, { 
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('❌ Registration should have failed validation');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Registration validation working:', error.response.data);
      return true;
    } else {
      console.log('❌ Unexpected registration error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
      return false;
    }
  }
}

async function runDiagnostics() {
  console.log('🚀 Running CASH-DNR Server Diagnostics');
  console.log('='.repeat(50));
  
  const results = {
    database: await testDatabaseConnection(),
    simpleEndpoint: await testSimpleEndpoint(), 
    verifyEndpoint: await testVerifyEndpoint(),
    registrationValidation: await testRegistrationValidation()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const totalPassed = Object.values(results).filter(Boolean).length;
  console.log(`\n📈 Overall: ${totalPassed}/${Object.keys(results).length} tests passed`);

  if (totalPassed === Object.keys(results).length) {
    console.log('🎉 All diagnostics passed!');
  } else {
    console.log('⚠️  Some diagnostics failed - check server logs');
  }
}

runDiagnostics().catch(error => {
  console.error('💥 Diagnostic failed:', error.message);
});
