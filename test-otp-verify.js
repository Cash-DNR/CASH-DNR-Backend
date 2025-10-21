/**
 * Quick OTP Verification Test
 */

import axios from 'axios';

async function verifyOTP() {
  try {
    // Use the VERY latest OTP - generate fresh one first
    console.log('⚠️  GENERATING FRESH OTP FIRST...');
    
    // Step 1: Get fresh credentials and OTP
    const credResponse = await axios.post('http://localhost:3000/api/auth/login/verify-credentials', {
      email: 'testuser.9508055555088@example.com',
      identifier: '9508055555088',
      password: 'TestPassword123!'
    });
    
    const otpKey = credResponse.data.data.otpKey;
    console.log(`🔑 Fresh OTP Key: ${otpKey}`);
    console.log('📱 Check server console for fresh OTP...');
    
    // Wait a moment for console display
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Latest OTP from server console: 153194 (generated at 21:23:20)
    const otp = '153194';
    
    console.log('🔐 Testing OTP Verification...');
    console.log(`🔑 OTP Key: ${otpKey}`);
    console.log(`🔢 OTP: ${otp}`);
    
    const response = await axios.post('http://localhost:3000/api/auth/login/verify-otp', {
      otpKey,
      otp
    });
    
    console.log('\n✅ OTP VERIFICATION SUCCESS!');
    console.log('📊 Response:', {
      success: response.data.success,
      message: response.data.message,
      tokenReceived: !!response.data.data?.token,
      userInfo: response.data.data?.user ? {
        id: response.data.data.user.id,
        email: response.data.data.user.email,
        username: response.data.data.user.username
      } : null
    });
    
    if (response.data.data?.token) {
      console.log('\n🎉 LOGIN COMPLETED SUCCESSFULLY!');
      console.log('🔐 JWT Token received - user is now authenticated');
    }
    
  } catch (error) {
    console.error('\n❌ OTP VERIFICATION FAILED:', {
      success: false,
      message: error.response?.data?.message || error.message,
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    });
  }
}

verifyOTP();
