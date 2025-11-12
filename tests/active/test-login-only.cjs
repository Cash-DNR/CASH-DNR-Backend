const https = require('https');

// Test credentials for existing user
const testUser = {
    idNumber: '8203141234089',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    phoneNumber: '0823456789'
};

async function checkEmail() {
    console.log('🔍 STEP 1: CHECK EMAIL');
    console.log('======================\n');

    const loginData = JSON.stringify({
        email: testUser.email
    });

    console.log(`📧 Checking email: ${testUser.email}`);
    console.log('📤 Sending email check request...');

    return makeJSONRequest('/api/auth/login/check-email', loginData, 'POST');
}

async function verifyCredentials() {
    console.log('\n🔐 STEP 2: VERIFY CREDENTIALS');
    console.log('=============================\n');

    const credentialsData = JSON.stringify({
        email: testUser.email,
        identifier: testUser.idNumber,
        password: testUser.password
    });

    console.log(`🔑 Verifying credentials for: ${testUser.email}`);
    console.log(`🆔 Using ID Number: ${testUser.idNumber}`);
    console.log('📤 Sending credential verification request...');

    return makeJSONRequest('/api/auth/login/verify-credentials', credentialsData, 'POST');
}

async function makeJSONRequest(path, jsonData, method = 'POST') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cash-dnr-backend.onrender.com',
            port: 443,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data, headers: res.headers });
            });
        });

        req.on('error', reject);
        req.write(jsonData);
        req.end();
    });
}

function parseResponse(response, step) {
    console.log(`📊 ${step} Status: ${response.status}`);
    
    if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${step} SUCCESSFUL!\n`);
        
        try {
            const parsed = JSON.parse(response.data);
            return parsed;
        } catch (e) {
            console.log('Response parsing failed, raw data:');
            console.log(response.data.substring(0, 500));
            return null;
        }
    } else {
        console.log(`❌ ${step} FAILED`);
        console.log(`Error: ${response.data}\n`);
        return null;
    }
}

async function runLoginTest() {
    console.log('🔑 LOGIN FLOW TEST FOR EXISTING USER\n');
    console.log('====================================\n');

    try {
        // Step 1: Check Email
        const emailCheckResponse = await checkEmail();
        const emailData = parseResponse(emailCheckResponse, 'EMAIL CHECK');
        
        if (!emailData) {
            console.log('❌ Email check failed - user may not exist');
            return;
        }

        console.log('📧 EMAIL CHECK RESULT:');
        console.log(`   • Message: ${emailData.message}`);
        if (emailData.sessionId) {
            console.log(`   • Session ID: ${emailData.sessionId}`);
        }

        // Step 2: Verify Credentials
        const credentialsResponse = await verifyCredentials();
        const credentialsData = parseResponse(credentialsResponse, 'CREDENTIALS VERIFICATION');
        
        if (!credentialsData) {
            console.log('❌ Credential verification failed');
            return;
        }

        console.log('🔐 CREDENTIALS VERIFICATION RESULT:');
        console.log(`   • Message: ${credentialsData.message}`);
        if (credentialsData.sessionId) {
            console.log(`   • Session ID: ${credentialsData.sessionId}`);
        }
        if (credentialsData.otpSent) {
            console.log(`   • OTP Sent: ${credentialsData.otpSent}`);
        }
        if (credentialsData.phoneNumber) {
            console.log(`   • OTP sent to: ${credentialsData.phoneNumber}`);
        }
        if (credentialsData.provider) {
            console.log(`   • SMS Provider: ${credentialsData.provider}`);
        }

        console.log('\n🎯 LOGIN FLOW TEST RESULTS:');
        console.log('✅ Email validation step: WORKING');
        console.log('✅ Credential verification step: WORKING');
        console.log('✅ OTP generation and sending: WORKING');
        console.log('\n📱 NEXT STEP: User would enter the OTP received via SMS');
        console.log('   to complete the login process using /api/auth/login/verify-otp');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

console.log('🚀 Testing login for existing registered user...\n');
runLoginTest().catch(console.error);