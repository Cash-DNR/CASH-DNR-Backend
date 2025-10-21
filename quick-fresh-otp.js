/**
 * Quick OTP Verification Test with Fresh OTP
 */

import axios from 'axios';

const verifyFreshOTP = async () => {
  try {
    console.log('🔐 Verifying FRESH OTP: 303779');
    console.log('🔑 Using OTP Key from test: d097b48b-66dd-4b5c-89a4-aa7215760b2f_1761083529539');
    
    const response = await axios.post('http://localhost:3000/api/auth/login/verify-otp', {
      otpKey: 'd097b48b-66dd-4b5c-89a4-aa7215760b2f_1761083529539',
      otp: '303779'
    });

    console.log('🎉 SUCCESS:', {
      success: response.data.success,
      message: response.data.message,
      hasToken: !!response.data.data?.token,
      tokenPreview: response.data.data?.token?.substring(0, 20) + '...',
      user: response.data.data?.user?.email
    });

  } catch (error) {
    console.log('❌ FAILED:', {
      success: false,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.response?.data?.code || 'UNKNOWN_ERROR'
    });
  }
};

verifyFreshOTP();
