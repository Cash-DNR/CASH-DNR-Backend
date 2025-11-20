const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

// Create simple test PDF content
const testPdf = Buffer.from(`
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000108 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
173
%%EOF
`);

async function testProductionRegistration() {
  console.log('🚀 PRODUCTION REGISTRATION TEST');
  console.log('='.repeat(50));

  // Generate unique email to avoid conflicts
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;

  // Create form for registration
  const form = new FormData();
  form.append('idNumber', '8203141234089');
  form.append('email', testEmail);
  form.append('phoneNumber', '+27823456789');
  form.append('password', 'TestPassword123!');
  form.append('streetAddress', '123 Test Street');
  form.append('town', 'Cape Town');
  form.append('city', 'Cape Town');
  form.append('province', 'Western Cape');
  form.append('postalCode', '8001');
  
  form.append('idDocument', testPdf, {
    filename: 'id.pdf',
    contentType: 'application/pdf'
  });
  form.append('proofOfResidence', testPdf, {
    filename: 'proof.pdf',
    contentType: 'application/pdf'
  });

  console.log(`📧 Using email: ${testEmail}`);
  console.log(`📱 Phone: +27823456789`);
  console.log(`🆔 ID Number: 8203141234089`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cash-dnr-backend.onrender.com',
      port: 443,
      path: '/api/auth/citizen',
      method: 'POST',
      headers: form.getHeaders()
    };

    console.log('\n📤 Sending registration request to production...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 REGISTRATION Status: ${res.statusCode}`);
        
        if (res.statusCode === 201) {
          console.log('✅ REGISTRATION SUCCESSFUL!');
          const response = JSON.parse(data);
          console.log('\n📋 REGISTRATION RESULT:');
          console.log(`   • User ID: ${response.data.user.id}`);
          console.log(`   • Email: ${response.data.user.email}`);
          console.log(`   • Name: ${response.data.user.first_name} ${response.data.user.last_name}`);
          console.log(`   • Tax Number: ${response.data.user.tax_number}`);
          console.log(`   • Files uploaded: ${response.data.files ? response.data.files.length : 0}`);
          
          resolve({ 
            success: true, 
            email: testEmail, 
            user: response.data.user,
            status: res.statusCode 
          });
        } else {
          console.log('❌ REGISTRATION FAILED');
          console.log(`Error: ${data}`);
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    form.pipe(req);
  });
}

async function testProductionLogin(email) {
  console.log('\n🔐 PRODUCTION LOGIN TEST');
  console.log('='.repeat(50));

  // Step 1: Check email
  console.log('\n🔍 STEP 1: CHECK EMAIL');
  console.log('='.repeat(30));
  
  const emailCheckResult = await makePostRequest('/api/auth/login/check-email', {
    email: email
  });

  if (emailCheckResult.status !== 200) {
    console.log('❌ Email check failed');
    return;
  }

  console.log('✅ Email check successful');

  // Step 2: Verify credentials and generate OTP
  console.log('\n🔑 STEP 2: VERIFY CREDENTIALS & GENERATE OTP');
  console.log('='.repeat(50));
  
  const credentialResult = await makePostRequest('/api/auth/login/verify-credentials', {
    email: email,
    password: 'TestPassword123!'
  });

  if (credentialResult.status !== 200) {
    console.log('❌ Credential verification failed');
    console.log(`Error: ${credentialResult.data}`);
    return;
  }

  console.log('✅ Credential verification successful');
  console.log('\n📱 OTP GENERATION RESULT:');
  console.log(`   • Message: ${JSON.parse(credentialResult.data).message}`);
  
  const response = JSON.parse(credentialResult.data);
  if (response.data && response.data.provider) {
    console.log(`   • Provider: ${response.data.provider}`);
    console.log(`   • Message ID: ${response.data.messageId || 'N/A'}`);
  }

  // Check if OTP is included in response for console mode
  if (response.otp) {
    console.log(`\n🎯 === OTP FROM RESPONSE ===`);
    console.log(`🔢 OTP CODE: ${response.otp}`);
    console.log(`🎯 ===========================`);
  } else {
    console.log('\n📱 OTP should be displayed in production server console');
    console.log('📋 Check Render.com logs for OTP display');
  }

  return response;
}

function makePostRequest(path, body) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    
    const options = {
      hostname: 'cash-dnr-backend.onrender.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      resolve({ status: 500, data: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runCompleteTest() {
  try {
    // Test registration first
    const registrationResult = await testProductionRegistration();
    
    if (!registrationResult.success) {
      console.log('\n❌ Cannot proceed with login test due to registration failure');
      return;
    }

    // If registration successful, test login
    await testProductionLogin(registrationResult.email);

    console.log('\n🎯 TEST COMPLETED!');
    console.log('📋 Next steps:');
    console.log('   1. Check Render.com logs to see OTP console output');
    console.log('   2. Use the OTP to test the verify-otp endpoint');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runCompleteTest();