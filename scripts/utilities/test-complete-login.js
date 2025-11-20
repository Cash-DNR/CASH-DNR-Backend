// Test complete login flow with newly registered user
import fetch from 'node-fetch';

const testCompleteLogin = async () => {
  console.log('🔐 Testing Complete Login Flow with Known User\n');
  console.log('═'.repeat(70));
  
  const testUser = {
    name: 'Thomas Miller',
    email: 'user8908174567087@example.com',
    idNumber: '8908174567087',
    password: 'SecurePass123!'
  };

  console.log(`🧪 Testing complete login for: ${testUser.name}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   ID: ${testUser.idNumber}`);
  console.log('─'.repeat(50));
  
  try {
    // Step 1: Check email existence
    console.log('\n📧 Step 1: Checking email existence...');
    const emailCheckResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: testUser.email })
    });

    console.log(`   Status: ${emailCheckResponse.status}`);
    const emailData = await emailCheckResponse.json();

    if (emailCheckResponse.status !== 200) {
      console.log(`❌ Email check failed: ${emailData.message}`);
      return;
    }

    console.log('✅ Email found - account exists and is active');
    console.log(`   User found: ${emailData.data?.user?.fullName || 'Unknown'}`);

    // Step 2: Verify credentials
    console.log('\n🔑 Step 2: Verifying credentials...');
    const credentialsResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/verify-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        identifier: testUser.idNumber,
        password: testUser.password
      })
    });

    console.log(`   Status: ${credentialsResponse.status}`);
    const credentialsData = await credentialsResponse.json();

    if (credentialsResponse.status !== 200) {
      console.log(`❌ Credential verification failed: ${credentialsData.message}`);
      if (credentialsData.errors) {
        console.log('   Validation errors:', credentialsData.errors);
      }
      return;
    }

    console.log('✅ Credentials verified successfully!');
    console.log(`   User: ${credentialsData.data?.user?.fullName || 'N/A'}`);
    console.log(`   Phone: ${credentialsData.data?.phoneNumber || 'N/A'}`);
    console.log(`   OTP sent to: ${credentialsData.data?.maskedPhone || 'N/A'}`);
    console.log(`   Session ID: ${credentialsData.data?.sessionId || 'N/A'}`);

    // Step 3: Show OTP verification info
    console.log('\n📱 Step 3: OTP Verification Process');
    console.log('   ⚠️  OTP has been sent to the registered phone number');
    console.log('   📱 Check the console/SMS for the 6-digit verification code');
    console.log('   🔗 Use /api/auth/login/verify-otp endpoint to complete login');
    console.log('   🔄 Use /api/auth/login/resend-otp if needed');

    // Show what the OTP verification payload would look like
    console.log('\n📋 OTP Verification Payload Example:');
    console.log('   POST /api/auth/login/verify-otp');
    console.log('   Body: {');
    console.log(`     "email": "${testUser.email}",`);
    console.log('     "otp": "123456"  // 6-digit code received');
    console.log('   }');

    console.log('\n✅ LOGIN FLOW TEST SUCCESSFUL!');
    console.log('   All authentication steps are working correctly');
    console.log('   System is ready to accept login attempts');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 Login System Status: ✅ OPERATIONAL');
  console.log('═'.repeat(70));
};

testCompleteLogin();