/**
 * Test Live SMS Service Configuration and Functionality
 */

import liveSMSService from './src/services/liveSMSService.js';

async function testSMSService() {
  console.log('🚀 Starting SMS Service Tests');
  console.log('='.repeat(60));

  try {
    // Test 1: Configuration Test
    console.log('\n🧪 Test 1: Configuration Test');
    const configResult = await liveSMSService.testConfiguration();
    console.log('✅ Configuration test passed:', configResult);

    // Test 2: Phone Number Formatting
    console.log('\n🧪 Test 2: Phone Number Formatting');
    const testNumbers = [
      '0682606328',
      '+27682606328',
      '068 260 6328',
      '068-260-6328'
    ];
    
    testNumbers.forEach(number => {
      const formatted = liveSMSService.formatPhoneNumber(number);
      console.log(`📱 ${number} → ${formatted}`);
    });

    // Test 3: OTP Generation
    console.log('\n🧪 Test 3: OTP Generation');
    for (let i = 0; i < 3; i++) {
      const otp = liveSMSService.generateOTP();
      console.log(`🔢 Generated OTP: ${otp}`);
    }

    // Test 4: Message Template
    console.log('\n🧪 Test 4: Message Template');
    const testOTP = '123456';
    const message = liveSMSService.createOTPMessage(testOTP);
    console.log(`📝 OTP Message: ${message}`);

    // Test 5: Send Test OTP (to your phone number)
    console.log('\n🧪 Test 5: Send Test OTP');
    console.log('⚠️  This will send a real SMS to your phone!');
    
    const testPhoneNumber = '0682606328'; // Your phone number
    console.log(`📱 Sending test OTP to: ${testPhoneNumber}`);
    
    const otpResult = await liveSMSService.sendOTP(testPhoneNumber, 'CASH-DNR-TEST');
    console.log('✅ OTP sent successfully!');
    console.log('📊 Result:', {
      messageId: otpResult.messageId,
      status: otpResult.status,
      provider: otpResult.provider,
      sentAt: otpResult.sentAt,
      otp: otpResult.otp // This shows the OTP for testing
    });

    console.log('\n🎉 All SMS tests completed successfully!');
    console.log('\n📱 Check your phone for the test OTP message');
    
  } catch (error) {
    console.error('\n❌ SMS Test Failed:', error.message);
    console.error('🔧 Possible issues:');
    console.error('   - Check Twilio credentials in .env file');
    console.error('   - Verify Twilio account is active and has credit');
    console.error('   - Ensure phone number is verified in Twilio (for trial accounts)');
    console.error('   - Check internet connection');
  }
}

// Run tests
testSMSService();
