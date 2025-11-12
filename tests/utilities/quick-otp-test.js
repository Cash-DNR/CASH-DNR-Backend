/**
 * Quick OTP Test - Latest Values
 */

import axios from 'axios';

async function quickTest() {
  // From server console at 21:36:54.643 - FRESH LATEST VALUES
  const otpKey = 'd097b48b-66dd-4b5c-89a4-aa7215760b2f_1761082614642';
  const otp = '416010';
  
  console.log('🔐 Testing LATEST OTP...');
  console.log(`🔑 OTP Key: ${otpKey}`);
  console.log(`🔢 OTP: ${otp}`);
  
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login/verify-otp', {
      otpKey,
      otp
    });
    
    console.log('\n🎉 *** SUCCESS! OTP VERIFIED! ***');
    console.log('📊 Response:', response.data);
    
    if (response.data.data?.token) {
      console.log('\n✅ JWT TOKEN RECEIVED - USER AUTHENTICATED!');
      console.log('🔐 Login process completed successfully');
    }
    
  } catch (error) {
    console.log('\n❌ FAILED:', error.response?.data || error.message);
  }
}

quickTest();
