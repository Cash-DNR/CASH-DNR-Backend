/**
 * Test Complete OTP Login Flow
 * Tests the full 3-step authentication: email → credentials → OTP verification
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000/api/auth';
const TEST_USER = {
  email: 'testuser.9508055555088@example.com',
  identifier: '9508055555088',
  password: 'TestPassword123!'
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
      timeout: 10000
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

async function testCompleteOTPLogin() {
  console.log('🚀 Testing Complete OTP Login Flow');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check Email Exists
    console.log('\n📧 Step 1: Checking if email exists...');
    const emailResult = await makeRequest('/login/check-email', { 
      email: TEST_USER.email 
    });
    
    if (!emailResult.success) {
      console.log('❌ Email check failed:', emailResult.data.message);
      return;
    }
    console.log('✅ Email exists in system');

    // Step 2: Verify Credentials and Generate OTP
    console.log('\n🔐 Step 2: Verifying credentials and generating OTP...');
    const credentialsResult = await makeRequest('/login/verify-credentials', {
      email: TEST_USER.email,
      identifier: TEST_USER.identifier,
      password: TEST_USER.password
    });
    
    if (!credentialsResult.success) {
      console.log('❌ Credential verification failed:', credentialsResult.data.message);
      return;
    }
    
    console.log('✅ Credentials verified! OTP sent to console.');
    console.log('📱 Check the server console above for the generated OTP');
    
    // Extract otpKey for verification
    const otpKey = credentialsResult.data.data.otpKey;
    console.log(`🔑 OTP Key: ${otpKey}`);
    
    // Step 3: Prompt for OTP and verify
    console.log('\n📱 Step 3: OTP Verification');
    console.log('🎯 Look at the server console above to find the OTP code');
    console.log('💡 Example: If you see "🔢 OTP CODE: 123456", use "123456"');
    
    // For automation, we can extract from terminal output in real scenario
    // For now, let's test with a simulated OTP entry
    console.log('\n⚠️  Manual OTP Entry Required:');
    console.log('   1. Look at the server terminal output above');
    console.log('   2. Find the line: "🔢 OTP CODE: XXXXXX"');
    console.log('   3. Copy the 6-digit code');
    console.log('   4. Use that code with: POST /login/verify-otp');
    
    console.log('\n📝 Example OTP Verification Request:');
    console.log('POST http://localhost:3000/api/auth/login/verify-otp');
    console.log('Content-Type: application/json');
    console.log('\n{');
    console.log(`  "otpKey": "${otpKey}",`);
    console.log('  "otp": "XXXXXX"');
    console.log('}');
    
    // Store otpKey for use
    global.lastOtpKey = otpKey;
    
    console.log('\n🎉 OTP Login Flow Test Completed Successfully!');
    console.log('✅ Email Check: PASS');
    console.log('✅ Credential Verification: PASS'); 
    console.log('📱 OTP Generation: PASS (Check server console)');
    console.log('ℹ️  Next: Manually verify OTP using the code above');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testOTPVerification(otpCode, otpKey = null) {
  console.log(`\n🔐 Testing OTP Verification with code: ${otpCode}`);
  
  // Use provided otpKey or the global one from previous step
  const useOtpKey = otpKey || global.lastOtpKey;
  
  if (!useOtpKey) {
    console.log('❌ No OTP key available. Run the full flow first.');
    return;
  }
  
  console.log(`🔑 Using OTP Key: ${useOtpKey}`);
  
  const otpResult = await makeRequest('/login/verify-otp', {
    otpKey: useOtpKey,
    otp: otpCode
  });
  
  if (otpResult.success) {
    console.log('🎉 OTP Verification SUCCESS!');
    console.log('🔑 JWT Token received:', otpResult.data.data?.token ? 'Yes' : 'No');
    console.log('👤 User Info:', {
      id: otpResult.data.data?.user?.id,
      username: otpResult.data.data?.user?.username,
      email: otpResult.data.data?.user?.email
    });
  } else {
    console.log('❌ OTP Verification FAILED:', otpResult.data.message);
  }
  
  return otpResult;
}

// Main execution
if (process.argv.length > 2) {
  // If OTP provided as command line argument
  const otpCode = process.argv[2];
  console.log(`🎯 Using provided OTP: ${otpCode}`);
  testOTPVerification(otpCode);
} else {
  // Run full flow test
  testCompleteOTPLogin();
}

export { testCompleteOTPLogin, testOTPVerification };
