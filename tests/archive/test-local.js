/**
 * Local CASH-DNR Registration Test Script
 * Tests the /citizen endpoint locally with ID: 8203141234089
 */

import axios from 'axios';

// Configuration for local testing
const BASE_URL = 'http://localhost:3000/api/auth';
const TEST_ID = '8203141234567';

// Test data based on the ID number provided
const testData = {
  valid: {
    idNumber: TEST_ID,
    contactInfo: {
      email: "testuser.8203141234567@example.com",
      phone: "+27 82 123 4567"
    },
    homeAddress: {
      streetAddress: "456 Test Street",
      town: "Sandton",
      city: "Johannesburg", 
      province: "Gauteng",
      postalCode: "2196"
    },
    password: "TestPassword123!"
  }
};

// Helper functions
const logTest = (testName, status, message, data = null) => {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  
  console.log(`\n${statusIcon} [${timestamp}] ${testName}`);
  console.log(`   Status: ${status}`);
  console.log(`   Message: ${message}`);
  
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
};

const makeRequest = async (endpoint, data, method = 'POST') => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // Extended timeout for Home Affairs API
    });
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || { message: error.message },
      error: error.message
    };
  }
};

const testLocalServerHealth = async () => {
  console.log('🔍 Testing Local Server Health...');
  
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    logTest('Local Server Health Check', 'PASS', 'Local server is running', {
      status: response.status,
      uptime: response.data.uptime || 'Unknown'
    });
    return true;
  } catch (error) {
    logTest('Local Server Health Check', 'FAIL', 'Local server is not accessible', {
      error: error.message,
      suggestion: 'Make sure to run: npm start'
    });
    return false;
  }
};

const testLocalIdVerification = async () => {
  console.log('🔍 Testing Local ID Verification...');
  
  const result = await makeRequest('/verify-id', { idNumber: TEST_ID });
  
  if (result.success && result.data.success) {
    logTest('Local ID Verification', 'PASS', 'ID verified successfully', {
      idNumber: TEST_ID,
      isValid: result.data.data.isValid,
      homeAffairsData: result.data.data.homeAffairsData,
      fallbackUsed: result.data.data.fallbackUsed
    });
    return result.data.data;
  } else {
    logTest('Local ID Verification', 'FAIL', result.data.message || result.error, {
      idNumber: TEST_ID,
      status: result.status,
      error: result.error,
      fullResponse: result.data
    });
    return null;
  }
};

const testLocalRegistration = async () => {
  console.log('🔍 Testing Local Valid Registration...');
  
  const result = await makeRequest('/citizen', testData.valid);
  
  if (result.success && result.data.success) {
    logTest('Local Valid Registration', 'PASS', 'User registered successfully', {
      userId: result.data.data.user.id,
      username: result.data.data.user.username,
      email: result.data.data.user.email,
      taxNumber: result.data.data.user.taxNumber,
      tokenReceived: !!result.data.data.token
    });
    return result.data.data;
  } else {
    logTest('Local Valid Registration', 'FAIL', result.data.message || result.error, {
      status: result.status,
      errors: result.data.errors || result.data.missingFields,
      fullResponse: result.data,
      error: result.error
    });
    return null;
  }
};

// Main test execution
const runLocalTests = async () => {
  console.log('🚀 Starting Local CASH-DNR Registration Test Suite');
  console.log('='.repeat(60));
  console.log(`📋 Test Configuration:`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test ID: ${TEST_ID}`);
  console.log(`   Test Email: ${testData.valid.contactInfo.email}`);
  console.log('='.repeat(60));

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Step 1: Check local server health
  const serverHealthy = await testLocalServerHealth();
  testResults.total++;
  if (serverHealthy) {
    testResults.passed++;
  } else {
    testResults.failed++;
    console.log('\n❌ Local server is not running. Please start it with: npm start');
    return;
  }

  // Step 2: Test ID verification locally
  const idVerificationResult = await testLocalIdVerification();
  testResults.total++;
  if (idVerificationResult) {
    testResults.passed++;
    console.log(`\n📊 Local ID Information:`);
    console.log(`   Name: ${idVerificationResult.homeAffairsData?.firstName} ${idVerificationResult.homeAffairsData?.lastName}`);
    console.log(`   Date of Birth: ${idVerificationResult.homeAffairsData?.dateOfBirth}`);
    console.log(`   Gender: ${idVerificationResult.homeAffairsData?.gender}`);
    console.log(`   Fallback Used: ${idVerificationResult.fallbackUsed ? 'Yes (Demo Data)' : 'No (Real API)'}`);
  } else {
    testResults.failed++;
  }

  // Step 3: Test local registration
  const registrationResult = await testLocalRegistration();
  testResults.total++;
  if (registrationResult) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // Display final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOCAL TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All local tests passed! The fixes are working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Deploy the fixed code to production');
    console.log('   2. Test the production server again');
    console.log('   3. Test additional features (cash notes, real-time, etc.)');
  } else {
    console.log('\n⚠️  Some local tests failed. Check the errors above.');
  }

  console.log('\n🔗 Local Endpoints:');
  console.log(`   - Health Check: http://localhost:3000/health`);
  console.log(`   - Registration: ${BASE_URL}/citizen`);
  console.log(`   - ID Verification: ${BASE_URL}/verify-id`);
};

// Handle script execution
runLocalTests().catch(error => {
  console.error('\n💥 Local test suite failed with error:', error.message);
  process.exit(1);
});

export {
  runLocalTests,
  testData,
  BASE_URL,
  TEST_ID
};
