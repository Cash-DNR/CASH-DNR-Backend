const https = require('https');
const querystring = require('querystring');

// Test credentials
const testData = {
  email: 'testuser@example.com',
  identifier: '8203141234089',
  password: 'TestPassword123!'
};

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testLoginWithFullOutput() {
  console.log('🧪 DETAILED LOGIN TEST WITH FULL RESPONSE OUTPUT\n');
  console.log('=' * 60);
  
  try {
    // Step 1: Email Check
    console.log('📧 STEP 1: EMAIL CHECK');
    console.log('-'.repeat(25));
    
    const emailOptions = {
      hostname: 'cash-dnr-backend.onrender.com',
      port: 443,
      path: '/api/auth/login/check-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const emailData = JSON.stringify({ email: testData.email });
    const emailResponse = await makeRequest(emailOptions, emailData);
    
    console.log(`Status: ${emailResponse.status}`);
    console.log('Response:', JSON.stringify(emailResponse.data, null, 2));
    console.log();
    
    if (emailResponse.status !== 200) {
      console.log('❌ Email check failed, stopping test');
      return;
    }
    
    // Step 2: Verify Credentials  
    console.log('🔐 STEP 2: CREDENTIAL VERIFICATION');
    console.log('-'.repeat(35));
    
    const credOptions = {
      hostname: 'cash-dnr-backend.onrender.com',
      port: 443,
      path: '/api/auth/login/verify-credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const credData = JSON.stringify({
      email: testData.email,
      identifier: testData.identifier,
      password: testData.password
    });
    
    const credResponse = await makeRequest(credOptions, credData);
    
    console.log(`Status: ${credResponse.status}`);
    console.log('Full Response:', JSON.stringify(credResponse.data, null, 2));
    
    if (credResponse.data && credResponse.data.data) {
      const responseData = credResponse.data.data;
      console.log('\n🎯 === OTP INFORMATION ===');
      console.log(`Provider: ${responseData.provider || 'Not specified'}`);
      console.log(`OTP Key: ${responseData.otpKey || 'Not provided'}`);
      console.log(`Phone: ${responseData.phoneNumber || 'Not provided'}`);
      
      if (responseData.testOTP) {
        console.log('\n🔢 *** OTP CODE FOR TESTING ***');
        console.log(`🎯 OTP: ${responseData.testOTP}`);
        console.log(`📝 Note: ${responseData.note || 'Use this code to complete login'}`);
        console.log('🔢 ****************************');
      } else {
        console.log('\n⚠️  No testOTP field found in response');
        console.log('💡 OTP should be displayed in server console logs');
      }
      console.log('🎯 ========================');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting detailed login test...\n');
testLoginWithFullOutput();