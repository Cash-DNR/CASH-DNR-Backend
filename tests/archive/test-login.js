/**
 * OTP Login Test for newly registered user
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/auth';
const credentials = {
  email: "testuser.9508055555088@example.com",
  identifier: "9508055555088", // ID number required  
  password: "TestPassword123!"
};

async function makeRequest(endpoint, data) {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: { 'Content-Type': 'application/json' },
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
}

async function testOTPLogin() {
  console.log('🔐 Testing OTP-based login for newly registered user...');
  console.log('📧 Email:', credentials.email);
  
  // Step 1: Check email
  console.log('\n📧 Step 1: Checking if email exists...');
  const emailCheck = await makeRequest('/login/check-email', { email: credentials.email });
  
  if (!emailCheck.success) {
    console.log('❌ Email check failed:', emailCheck.data.message);
    return;
  }
  
  console.log('✅ Email exists in system');
  
  // Step 2: Verify credentials  
  console.log('\n🔐 Step 2: Verifying credentials...');
  const credentialsCheck = await makeRequest('/login/verify-credentials', credentials);
  
  if (!credentialsCheck.success) {
    console.log('❌ Credentials verification failed:', credentialsCheck.data.message);
    return;
  }
  
  console.log('✅ Credentials verified!');
  console.log('📱 OTP sent to phone:', credentialsCheck.data.data?.phoneNumber);
  
  console.log('\n📊 Login Flow Summary:');
  console.log('  ✅ Email verification: PASS');
  console.log('  ✅ Credential verification: PASS');  
  console.log('  📱 OTP sent to user phone');
  console.log('  ℹ️  To complete login: Use /login/verify-otp with the received OTP');
  
  console.log('\n🔗 Next Steps:');
  console.log('  1. User receives OTP via SMS');
  console.log('  2. User enters OTP in app');
  console.log('  3. App calls /login/verify-otp with OTP');
  console.log('  4. System returns JWT token for authenticated session');
}

testOTPLogin();
