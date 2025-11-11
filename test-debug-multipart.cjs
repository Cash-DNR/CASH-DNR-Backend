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

async function testDebugEndpoint() {
    const form = new FormData();
    
    // Add the same files that fail in registration
    form.append('idDocument', testPdf, {
        filename: 'test-id.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('proofOfResidence', testPdf, {
        filename: 'test-proof.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('bankStatement', testPdf, {
        filename: 'test-bank.pdf',
        contentType: 'application/pdf'
    });

    const options = {
        hostname: 'cash-dnr-backend.onrender.com',
        port: 443,
        path: '/api/debug/debug-multipart',
        method: 'POST',
        headers: form.getHeaders()
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('=== DEBUG ENDPOINT TEST ===');
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers:`, res.headers);
                console.log(`Response: ${data}`);
                console.log('=== END ===\n');
                resolve({ status: res.statusCode, data, headers: res.headers });
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });

        form.pipe(req);
    });
}

async function testRegistrationEndpoint() {
    const form = new FormData();
    
    // Add registration data
    form.append('firstName', 'John');
    form.append('lastName', 'Doe');
    form.append('idNumber', '8203141234089');
    form.append('cellphone', '0123456789');
    form.append('email', 'john.doe@example.com');
    form.append('password', 'TempPassword123!');
    form.append('businessType', 'sole_trader');
    
    // Add the same files
    form.append('idDocument', testPdf, {
        filename: 'test-id.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('proofOfResidence', testPdf, {
        filename: 'test-proof.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('bankStatement', testPdf, {
        filename: 'test-bank.pdf',
        contentType: 'application/pdf'
    });

    const options = {
        hostname: 'cash-dnr-backend.onrender.com',
        port: 443,
        path: '/api/auth/citizen',
        method: 'POST',
        headers: form.getHeaders()
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('=== REGISTRATION ENDPOINT TEST ===');
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers:`, res.headers);
                console.log(`Response: ${data}`);
                console.log('=== END ===\n');
                resolve({ status: res.statusCode, data, headers: res.headers });
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });

        form.pipe(req);
    });
}

async function runComparison() {
    console.log('Testing isolated debug endpoint vs registration endpoint...\n');
    
    try {
        // Test debug endpoint first
        const debugResult = await testDebugEndpoint();
        
        // Test registration endpoint
        const regResult = await testRegistrationEndpoint();
        
        console.log('=== COMPARISON ===');
        console.log(`Debug Status: ${debugResult.status}`);
        console.log(`Registration Status: ${regResult.status}`);
        
        if (debugResult.status === 200 && regResult.status !== 201) {
            console.log('\n✅ Debug endpoint works - ❌ Registration fails');
            console.log('This confirms the issue is in registration logic, not multer setup');
        } else if (debugResult.status !== 200) {
            console.log('\n❌ Both endpoints fail - issue is in multer infrastructure');
        } else {
            console.log('\n✅ Both endpoints work - no issue found');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runComparison();