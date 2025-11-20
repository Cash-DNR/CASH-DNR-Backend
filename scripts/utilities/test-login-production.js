// Test login functionality with existing production users - Multi-step login process
import fetch from 'node-fetch';

const testLogin = async () => {
  console.log('🔐 Testing Multi-Step Login Functionality on Production\n');
  console.log('═'.repeat(70));
  
  // Test users from production database
  const testUsers = [
    {
      name: 'Jennifer Davis',
      email: 'user@example.com',
      idNumber: '9105289012088',
      password: 'SecurePass123!'
    },
    {
      name: 'Amanda Taylor', 
      email: 'admin@gmail.com',
      idNumber: '9403225678082',
      password: 'SecurePass123!'
    },
    {
      name: 'Michelle White',
      email: 'testuser@example.com', 
      idNumber: '8203141234089',
      password: 'SecurePass123!'
    }
  ];

  for (const user of testUsers) {
    console.log(`\n🧪 Testing login for: ${user.name} (${user.email})`);
    console.log('─'.repeat(50));
    
    try {
      // Step 1: Check email existence
      console.log('\n� Step 1: Checking email existence...');
      const emailCheckResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      console.log(`   Status: ${emailCheckResponse.status}`);
      const emailData = await emailCheckResponse.json();

      if (emailCheckResponse.status !== 200) {
        console.log(`❌ Email check failed: ${emailData.message}`);
        continue; // Skip to next user
      }

      console.log('✅ Email found - proceeding to credential verification');

      // Step 2: Verify credentials
      console.log('\n🔑 Step 2: Verifying credentials...');
      const credentialsResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/verify-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          identifier: user.idNumber,
          password: user.password
        })
      });

      console.log(`   Status: ${credentialsResponse.status}`);
      const credentialsData = await credentialsResponse.json();

      if (credentialsResponse.status !== 200) {
        console.log(`❌ Credential verification failed: ${credentialsData.message}`);
        if (credentialsData.errors) {
          console.log('   Validation errors:', credentialsData.errors);
        }
        continue; // Skip to next user
      }

      console.log('✅ Credentials verified - OTP should be sent');
      console.log(`   Phone: ${credentialsData.data?.phoneNumber || 'N/A'}`);
      console.log(`   OTP sent to: ${credentialsData.data?.maskedPhone || 'N/A'}`);

      // Step 3: Simulate OTP verification (we'll need the actual OTP)
      console.log('\n📱 Step 3: OTP verification needed');
      console.log('   Note: This would require the actual OTP sent to the phone');
      console.log('   In a real test, you would enter the 6-digit code here');

      // We can't proceed without the actual OTP, but the test shows the flow is working
      console.log('✅ Login flow working up to OTP verification step');

    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📋 Login Flow Summary');
  console.log('═'.repeat(70));
  console.log('1. ✅ Email check endpoint: /api/auth/login/check-email');
  console.log('2. ✅ Credentials verification: /api/auth/login/verify-credentials');
  console.log('3. 📱 OTP verification needed: /api/auth/login/verify-otp');
  console.log('4. 🔄 OTP resend available: /api/auth/login/resend-otp');
  
  // Test a simple credential verification without going through email check
  console.log('\n' + '═'.repeat(70));
  console.log('🔬 Direct Credential Test (Skip Email Check)');
  console.log('═'.repeat(70));

  try {
    const directResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login/verify-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@example.com',
        identifier: '9105289012088',
        password: 'SecurePass123!'
      })
    });

    console.log(`📊 Direct verification status: ${directResponse.status}`);
    const directData = await directResponse.json();
    
    if (directResponse.status === 200) {
      console.log('✅ Direct credential verification successful!');
      console.log(`   User: ${directData.data?.user?.fullName || 'N/A'}`);
      console.log(`   OTP sent: ${directData.data?.maskedPhone || 'N/A'}`);
    } else {
      console.log('❌ Direct verification failed');
      console.log(`   Error: ${directData.message}`);
    }
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }
};

testLogin();