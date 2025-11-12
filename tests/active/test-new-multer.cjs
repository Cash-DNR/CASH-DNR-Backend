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
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
176
%%EOF
`);

async function testNewMulter() {
    console.log('🔍 Testing NEW MULTER configuration...\n');

    // Test 1: Single file upload
    const form1 = new FormData();
    form1.append('file', testPdf, {
        filename: 'test.pdf',
        contentType: 'application/pdf'
    });

    console.log('1️⃣ Testing single file upload...');
    const singleFileResult = await makeRequest('/api/test-multer/single-file', form1);
    
    // Test 2: Registration-style multi-file upload
    const form2 = new FormData();
    form2.append('idDocument', testPdf, {
        filename: 'id.pdf',
        contentType: 'application/pdf'
    });
    form2.append('proofOfResidence', testPdf, {
        filename: 'proof.pdf',
        contentType: 'application/pdf'
    });
    form2.append('bankStatement', testPdf, {
        filename: 'bank.pdf',
        contentType: 'application/pdf'
    });
    
    // Add form fields
    form2.append('firstName', 'Test');
    form2.append('lastName', 'User');

    console.log('2️⃣ Testing registration-style multi-file upload...');
    const multiFileResult = await makeRequest('/api/test-multer/registration-files', form2);
    
    // Test 3: Updated registration endpoint
    const form3 = new FormData();
    form3.append('idNumber', '8203141234089');
    form3.append('email', 'test@example.com');
    form3.append('phoneNumber', '0123456789');
    form3.append('password', 'TempPassword123!');
    form3.append('businessType', 'sole_trader');
    form3.append('streetAddress', '123 Test St');
    form3.append('town', 'TestTown');
    form3.append('city', 'TestCity');
    form3.append('province', 'TestProvince');
    form3.append('postalCode', '1234');
    
    form3.append('idDocument', testPdf, {
        filename: 'id.pdf',
        contentType: 'application/pdf'
    });

    console.log('3️⃣ Testing UPDATED registration endpoint...');
    const registrationResult = await makeRequest('/api/auth/citizen', form3);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Single file test: ${singleFileResult.status === 200 ? '✅ PASS' : '❌ FAIL'} (${singleFileResult.status})`);
    console.log(`Multi-file test: ${multiFileResult.status === 200 ? '✅ PASS' : '❌ FAIL'} (${multiFileResult.status})`);
    console.log(`Registration test: ${registrationResult.status === 201 ? '✅ PASS' : '❌ FAIL'} (${registrationResult.status})`);
    
    if (singleFileResult.status === 200 && multiFileResult.status === 200) {
        console.log('\n✅ NEW MULTER CONFIGURATION IS WORKING!');
    } else {
        console.log('\n❌ New multer has issues');
    }
}

async function makeRequest(path, form) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cash-dnr-backend.onrender.com',
            port: 443,
            path,
            method: 'POST',
            headers: form.getHeaders()
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode >= 400) {
                    console.log(`Error: ${data}`);
                } else {
                    console.log(`Success: Files processed correctly`);
                }
                console.log('---\n');
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });

        form.pipe(req);
    });
}

testNewMulter().catch(console.error);