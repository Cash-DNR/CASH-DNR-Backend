// Test OTP display in web response
import fetch from 'node-fetch';

const testOTPWebDisplay = async () => {
  console.log('🌐 Testing OTP Display in Web Console Response\n');
  console.log('═'.repeat(70));
  
  const testUser = {
    name: 'Thomas Miller',
    email: 'user8908174567087@example.com',
    idNumber: '8908174567087',
    password: 'SecurePass123!'
  };

  console.log(`🧪 Testing OTP web display for: ${testUser.name}`);
  console.log(`   Email: ${testUser.email}`);
  console.log('─'.repeat(50));
  
  try {
    // Step 1: Check email existence
    console.log('\n📧 Step 1: Email Check');
    const emailCheckResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: testUser.email })
    });

    const emailData = await emailCheckResponse.json();
    console.log(`   Status: ${emailCheckResponse.status}`);
    
    if (emailCheckResponse.status !== 200) {
      console.log(`❌ Email check failed: ${emailData.message}`);
      return;
    }

    console.log('✅ Email verified');

    // Step 2: Verify credentials and get OTP in response
    console.log('\n🔑 Step 2: Credential Verification + OTP Generation');
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
        console.log('   Errors:', JSON.stringify(credentialsData.errors, null, 2));
      }
      return;
    }

    console.log('✅ Credentials verified successfully!');
    console.log('\n📱 OTP Information from Web Response:');
    console.log('─'.repeat(50));
    console.log(`   Provider: ${credentialsData.data?.provider || 'N/A'}`);
    console.log(`   Phone: ${credentialsData.data?.phoneNumber || 'N/A'}`);
    console.log(`   Expires in: ${credentialsData.data?.expiresIn || 'N/A'} seconds`);
    console.log(`   Message ID: ${credentialsData.data?.messageId || 'N/A'}`);
    console.log(`   OTP Key: ${credentialsData.data?.otpKey || 'N/A'}`);

    // Check for OTP in different response fields
    if (credentialsData.data?.testOTP) {
      console.log('\n🎯 === OTP FROM WEB RESPONSE (TEST MODE) ===');
      console.log(`🔢 OTP CODE: ${credentialsData.data.testOTP}`);
      console.log(`📝 Note: ${credentialsData.data.note || 'N/A'}`);
      console.log('🎯 ======================================');
    }

    if (credentialsData.data?.devOTP) {
      console.log('\n🔧 === OTP FROM WEB RESPONSE (DEV MODE) ===');
      console.log(`🔢 OTP CODE: ${credentialsData.data.devOTP}`);
      console.log(`📝 Note: ${credentialsData.data.devNote || 'N/A'}`);
      console.log('🔧 ====================================');
    }

    if (!credentialsData.data?.testOTP && !credentialsData.data?.devOTP) {
      console.log('\n⚠️  OTP not visible in web response');
      console.log('   Check server console for OTP display');
    }

    // Show the full response for debugging
    console.log('\n📋 Full Response Data:');
    console.log(JSON.stringify(credentialsData, null, 2));

    // Step 3: Try to use the OTP if we got it
    const otpCode = credentialsData.data?.testOTP || credentialsData.data?.devOTP;
    const otpKey = credentialsData.data?.otpKey;
    
    if (otpCode && otpKey) {
      console.log('\n🔐 Step 3: Testing OTP Verification with Retrieved OTP');
      console.log(`   Using OTP: ${otpCode}`);
      console.log(`   Using Key: ${otpKey}`);
      
      const otpResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otpKey: otpKey,
          otp: otpCode
        })
      });

      console.log(`   OTP Verification Status: ${otpResponse.status}`);
      const otpData = await otpResponse.json();

      if (otpResponse.status === 200) {
        console.log('🎉 COMPLETE LOGIN SUCCESS!');
        console.log(`   User: ${otpData.data?.user?.fullName || 'N/A'}`);
        console.log(`   JWT Token: ${otpData.data?.token?.substring(0, 50)}... (truncated)`);
        console.log('   ✅ Login flow completed successfully!');
      } else {
        console.log('❌ OTP verification failed');
        console.log(`   Error: ${otpData.message || 'Unknown error'}`);
        if (otpData.errors) {
          console.log('   Details:', JSON.stringify(otpData.errors, null, 2));
        }
      }
    } else {
      console.log('\n⚠️  Cannot test OTP verification - missing OTP code or key');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('🏁 OTP Web Display Test Completed');
  console.log('═'.repeat(70));
};

testOTPWebDisplay();