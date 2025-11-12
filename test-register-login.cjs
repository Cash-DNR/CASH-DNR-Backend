const FormData = require('form-data');
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
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
176
%%EOF
`);

// Test credentials
const testUser = {
    idNumber: '8203141234089',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    phoneNumber: '0823456789'
};

async function registerUser() {
    console.log('🔥 STEP 1: REGISTERING NEW USER WITH DOCUMENTS');
    console.log('==========================================\n');

    const form = new FormData();
    form.append('idNumber', testUser.idNumber);
    form.append('email', testUser.email);
    form.append('phoneNumber', testUser.phoneNumber);
    form.append('password', testUser.password);
    form.append('businessType', 'sole_trader');
    form.append('streetAddress', '123 Test Street');
    form.append('town', 'Rosebank');
    form.append('city', 'Johannesburg');
    form.append('province', 'Gauteng');
    form.append('postalCode', '2196');
    
    // Add documents
    form.append('idDocument', testPdf, {
        filename: 'south_african_id.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('proofOfResidence', testPdf, {
        filename: 'utility_bill.pdf',
        contentType: 'application/pdf'
    });

    console.log('📋 Registration Details:');
    console.log(`   • ID Number: ${testUser.idNumber}`);
    console.log(`   • Email: ${testUser.email}`);
    console.log(`   • Phone: ${testUser.phoneNumber}`);
    console.log(`   • Password: ${testUser.password}`);
    console.log(`   • Business Type: sole_trader`);
    console.log(`   • Location: Rosebank, Johannesburg`);
    console.log(`   • Documents: ID + Proof of Residence`);
    
    console.log('\n📤 Sending registration request...');

    return makeRequest('/api/auth/citizen', form, 'POST');
}

async function loginUser() {
    console.log('\n🔑 STEP 2: TESTING LOGIN WITH REGISTERED CREDENTIALS');
    console.log('=================================================\n');

    const loginData = JSON.stringify({
        email: testUser.email,
        password: testUser.password
    });

    console.log('🔐 Login Details:');
    console.log(`   • Email: ${testUser.email}`);
    console.log(`   • Password: ${testUser.password}`);
    
    console.log('\n📤 Sending login request...');

    return makeJSONRequest('/api/auth/login', loginData, 'POST');
}

async function makeRequest(path, form, method = 'POST') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cash-dnr-backend.onrender.com',
            port: 443,
            path,
            method,
            headers: form.getHeaders()
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data, headers: res.headers });
            });
        });

        req.on('error', reject);
        form.pipe(req);
    });
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

async function runCompleteTest() {
    console.log('🚀 COMPLETE REGISTRATION → LOGIN TEST\n');
    console.log('=====================================\n');

    try {
        // Step 1: Register
        const registrationResponse = await registerUser();
        const regData = parseResponse(registrationResponse, 'REGISTRATION');
        
        if (!regData) {
            console.log('❌ Registration failed, cannot proceed with login test');
            return;
        }

        console.log('👤 REGISTERED USER INFO:');
        if (regData.data && regData.data.user) {
            console.log(`   • User ID: ${regData.data.user.id}`);
            console.log(`   • Email: ${regData.data.user.email}`);
            console.log(`   • Full Name: ${regData.data.user.fullName}`);
            console.log(`   • Home Affairs Verified: ${regData.data.user.homeAffairsVerified}`);
            console.log(`   • Tax Number: ${regData.data.user.taxNumber}`);
            console.log(`   • Registration Token: ${regData.data.token.substring(0, 30)}...`);
        }

        // Step 2: Login
        const loginResponse = await loginUser();
        const loginData = parseResponse(loginResponse, 'LOGIN');
        
        if (!loginData) {
            console.log('❌ Login failed');
            return;
        }

        console.log('🔑 LOGIN SUCCESS INFO:');
        if (loginData.user) {
            console.log(`   • User ID: ${loginData.user.id}`);
            console.log(`   • Email: ${loginData.user.email}`);
            console.log(`   • Full Name: ${loginData.user.fullName}`);
            console.log(`   • Login Token: ${loginData.token.substring(0, 30)}...`);
            console.log(`   • Token Expires: ${loginData.expiresIn || 'Not specified'}`);
        }

        console.log('\n🎉 COMPLETE TEST SUCCESSFUL!');
        console.log('✅ User registration with documents: WORKING');
        console.log('✅ User login with credentials: WORKING');
        console.log('✅ Token generation: WORKING');
        console.log('✅ Full authentication flow: OPERATIONAL');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

runCompleteTest().catch(console.error);