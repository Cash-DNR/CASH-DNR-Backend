/**
 * Integrated OTP Test - Generate and Verify Immediately
 */

import axios from 'axios';

const testFullLoginFlow = async () => {
  try {
    console.log('🚀 Starting Complete OTP Login Flow (Generate & Verify Immediately)');
    console.log('='.repeat(70));

    // Step 1: Check email
    console.log('📧 Step 1: Checking email...');
    const emailCheck = await axios.post('http://localhost:3000/api/auth/login/check-email', {
      email: 'testuser.9508055555088@example.com'
    });
    console.log('✅ Email exists');

    // Step 2: Verify credentials (this generates OTP)
    console.log('🔐 Step 2: Verifying credentials and generating OTP...');
    const credentialsResponse = await axios.post('http://localhost:3000/api/auth/login/verify-credentials', {
      email: 'testuser.9508055555088@example.com',
      identifier: '9508055555088',
      password: 'TestPassword123!'
    });

    const otpKey = credentialsResponse.data.data.otpKey;
    console.log('✅ Credentials verified! OTP Key obtained:', otpKey);
    console.log('📱 Check server console for the OTP...');

    // Wait a moment for user to see the OTP in console
    console.log('⏳ Waiting 3 seconds for you to check the server console for the OTP...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Prompt user for OTP
    console.log('\n🎯 === MANUAL OTP INPUT REQUIRED ===');
    console.log('1. Look at the server console output above');
    console.log('2. Find the line: "🔢 OTP CODE: XXXXXX"');
    console.log('3. This test will use placeholder "000000" (you can modify the code)');
    console.log('================================\n');

    // Using the FRESH OTP from server console
    const demoOtp = '952084'; // Fresh OTP from server console

    console.log(`🧪 Attempting OTP verification with: ${demoOtp}`);
    console.log('⚠️  This will likely fail since we\'re using placeholder OTP');

    try {
      const otpResponse = await axios.post('http://localhost:3000/api/auth/login/verify-otp', {
        otpKey: otpKey,
        otp: demoOtp
      });

      console.log('🎉 SUCCESS! Login completed:', {
        hasToken: !!otpResponse.data.data?.token,
        tokenPreview: otpResponse.data.data?.token?.substring(0, 20) + '...',
        user: otpResponse.data.data?.user?.email
      });

    } catch (otpError) {
      console.log('❌ OTP Verification failed (expected with placeholder OTP):', {
        message: otpError.response?.data?.message || otpError.message,
        code: otpError.response?.data?.code
      });

      console.log('\n📝 To complete the test successfully:');
      console.log('1. Copy the 6-digit OTP from the server console above');
      console.log('2. Replace "000000" in this script with the actual OTP');
      console.log('3. Run the script again quickly (within 10 minutes)');
      console.log(`4. Use OTP Key: ${otpKey}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
};

testFullLoginFlow();
