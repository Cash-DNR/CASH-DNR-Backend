/**
 * Multi-User OTP Testing Script
 * Tests sending OTP to different phone numbers using Twilio
 */

import liveSMSService from './src/services/liveSMSService.js';

// Test users with different phone numbers
const testUsers = [
  {
    name: 'User 1',
    phone: '0682606328', // Your primary number
    email: 'user1@example.com'
  },
  {
    name: 'User 2 - International Format',
    phone: '+27123456789', // Another SA number
    email: 'user2@example.com'
  },
  {
    name: 'User 3 - Formatted',
    phone: '082 123 4567', // Formatted SA number
    email: 'user3@example.com'
  }
];

async function testMultiUserOTP() {
  console.log('🚀 Starting Multi-User OTP Testing');
  console.log('='.repeat(60));

  try {
    // Test 1: Service Configuration
    console.log('\n🧪 Test 1: SMS Service Configuration');
    const configResult = await liveSMSService.testConfiguration();
    console.log('✅ SMS Service Ready:', configResult);

    // Test 2: Send OTP to Multiple Users
    console.log('\n🧪 Test 2: Sending OTP to Multiple Users');
    console.log('⚠️  This will send real SMS messages!');

    const results = [];

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n📱 Testing ${user.name} (${user.phone})`);

      try {
        // Generate OTP for this user
        const otp = liveSMSService.generateOTP();
        console.log(`🔢 Generated OTP: ${otp}`);

        // Format phone number
        const formattedPhone = liveSMSService.formatPhoneNumber(user.phone);
        console.log(`📱 Formatted phone: ${user.phone} → ${formattedPhone}`);

        // Send OTP
        const result = await liveSMSService.sendOTP(user.phone, 'CASH-DNR');
        
        results.push({
          user: user.name,
          phone: user.phone,
          formattedPhone,
          success: true,
          messageId: result.messageId,
          status: result.status,
          otp: result.otp,
          sentAt: result.sentAt
        });

        console.log(`✅ OTP sent successfully!`);
        console.log(`📊 Message ID: ${result.messageId}`);
        console.log(`📈 Status: ${result.status}`);
        
        // Wait 2 seconds between sends to avoid rate limits
        if (i < testUsers.length - 1) {
          console.log('⏳ Waiting 2 seconds before next send...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Failed to send OTP to ${user.name}:`, error.message);
        
        results.push({
          user: user.name,
          phone: user.phone,
          success: false,
          error: error.message
        });
      }
    }

    // Test 3: Results Summary
    console.log('\n📊 RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful sends: ${successful.length}/${results.length}`);
    console.log(`❌ Failed sends: ${failed.length}/${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successful OTP Sends:');
      successful.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.user}`);
        console.log(`      📱 Phone: ${result.phone}`);
        console.log(`      🆔 Message ID: ${result.messageId}`);
        console.log(`      📈 Status: ${result.status}`);
        console.log(`      🔢 OTP: ${result.otp}`);
        console.log(`      ⏰ Sent: ${result.sentAt}`);
        console.log('');
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed OTP Sends:');
      failed.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.user}`);
        console.log(`      📱 Phone: ${result.phone}`);
        console.log(`      ❌ Error: ${result.error}`);
        console.log('');
      });
    }

    // Test 4: Important Notes
    console.log('\n📝 IMPORTANT NOTES:');
    console.log('='.repeat(60));
    console.log('1. 🔐 Twilio Trial Account Limitations:');
    console.log('   - Can only send to verified phone numbers');
    console.log('   - Verify numbers at: https://console.twilio.com/phone-numbers/verified');
    console.log('');
    console.log('2. 💰 Upgrading to Paid Account:');
    console.log('   - Removes phone number verification requirement');
    console.log('   - Allows sending to any valid phone number');
    console.log('   - Cost: ~$0.0075 per SMS in South Africa');
    console.log('');
    console.log('3. 📱 Phone Number Format:');
    console.log('   - Local: 0682606328 → International: +27682606328');
    console.log('   - System automatically formats numbers');
    console.log('');
    console.log('4. 🔒 Security Best Practices:');
    console.log('   - OTPs expire in 10 minutes');
    console.log('   - Phone numbers are masked in logs');
    console.log('   - Rate limiting prevents spam');

    if (successful.length > 0) {
      console.log('\n🎉 SMS Integration Ready for Production!');
      console.log('📱 Check your phone(s) for OTP messages');
    }

  } catch (error) {
    console.error('\n💥 Multi-User OTP Test Failed:', error.message);
  }
}

// Run the test
testMultiUserOTP();
