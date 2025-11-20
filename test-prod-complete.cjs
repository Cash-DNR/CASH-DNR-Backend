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

async function testProductionLogin(testEmail, password = 'TestPassword123!') {
  console.log('\n🔐 PRODUCTION LOGIN TEST');
  console.log('='.repeat(50));
  console.log(`📧 Testing with email: ${testEmail}`);
  console.log(`🔑 Password: ${password}`);

  // Step 1: Check email
  console.log('\n🔍 STEP 1: CHECK EMAIL');
  console.log('='.repeat(30));
  
  const emailCheckResult = await makePostRequest('/api/auth/login/check-email', {
    email: testEmail
  });

  console.log(`📊 Email check status: ${emailCheckResult.status}`);
  if (emailCheckResult.status !== 200) {
    console.log('❌ Email check failed');
    console.log(`Response: ${emailCheckResult.data}`);
    return;
  }

  console.log('✅ Email check successful');

  // Step 2: Verify credentials and generate OTP
  console.log('\n🔑 STEP 2: VERIFY CREDENTIALS & GENERATE OTP');
  console.log('='.repeat(50));
  
  const credentialResult = await makePostRequest('/api/auth/login/verify-credentials', {
    email: testEmail,
    password: password
  });

  console.log(`📊 Credential verification status: ${credentialResult.status}`);
  
  if (credentialResult.status !== 200) {
    console.log('❌ Credential verification failed');
    console.log(`Error: ${credentialResult.data}`);
    return;
  }

  console.log('✅ Credential verification successful');
  console.log('\n📱 OTP GENERATION RESULT:');
  
  try {
    const response = JSON.parse(credentialResult.data);
    console.log(`   • Message: ${response.message}`);
    
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
      console.log('\n💡 The OTP may appear as:');
      console.log('   "📱 SMS Console: [OTP_CODE]" in the server logs');
    }

    return response;
  } catch (e) {
    console.log('❌ Failed to parse response:', credentialResult.data);
  }
}

async function testProductionRegistration() {
  console.log('\n🚀 PRODUCTION REGISTRATION TEST');
  console.log('='.repeat(50));

  // Generate unique ID and email to avoid conflicts
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1000);
  
  // Generate a valid-looking SA ID number (format: YYMMDDGGGGSACZ)
  const year = '95'; // Birth year 1995
  const month = '08';
  const day = '15';
  const gender = '5'; // 5-9 for female
  const sequence = String(randomPart).padStart(3, '0');
  const citizenship = '0'; // SA citizen
  // Calculate check digit (simplified)
  const baseId = `${year}${month}${day}${gender}${sequence}${citizenship}`;
  const checkDigit = Math.floor(Math.random() * 10);
  const idNumber = `${baseId}${checkDigit}`;
  
  const testEmail = `test${timestamp}${randomPart}@example.com`;
  const phoneNumber = `+2782${randomPart.toString().padStart(7, '3')}`;

  // Create form for registration
  const form = new FormData();
  form.append('idNumber', idNumber);
  form.append('email', testEmail);
  form.append('phoneNumber', phoneNumber);
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

  console.log(`📧 Email: ${testEmail}`);
  console.log(`📱 Phone: ${phoneNumber}`);
  console.log(`🆔 ID Number: ${idNumber}`);

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
    console.log('🎯 TESTING PRODUCTION ENVIRONMENT');
    console.log('📍 URL: https://cash-dnr-backend.onrender.com');
    console.log('📅 Date:', new Date().toLocaleString());
    console.log('='.repeat(60));

    // Option 1: Test with existing user (if any known email/password)
    console.log('\n📋 OPTION 1: Test login with existing user');
    console.log('(This will fail if no users exist, but will show OTP behavior)');
    
    // Try a common test email that might exist
    await testProductionLogin('test@example.com', 'TestPassword123!');

    // Option 2: Try registration with new unique data
    console.log('\n📋 OPTION 2: Register new user and then login');
    const registrationResult = await testProductionRegistration();
    
    if (registrationResult && registrationResult.success) {
      console.log('\n🔄 Now testing login with newly registered user...');
      await testProductionLogin(registrationResult.email);
    }

    console.log('\n🎯 PRODUCTION TEST COMPLETED!');
    console.log('📋 Key observations:');
    console.log('   1. Check Render.com logs to see OTP console output');
    console.log('   2. Look for "📱 SMS Console:" messages in production logs');
    console.log('   3. If no OTP visible, the console SMS changes may not be deployed yet');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if we should test with specific email from command line
const args = process.argv.slice(2);
if (args.length > 0) {
  const testEmail = args[0];
  const testPassword = args[1] || 'TestPassword123!';
  console.log(`🎯 Testing login with provided email: ${testEmail}`);
  testProductionLogin(testEmail, testPassword);
} else {
  runCompleteTest();
}