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

async function registerUniqueUser() {
    // Generate unique timestamp for email
    const timestamp = Date.now();
    const uniqueEmail = `testuser_${timestamp}@example.com`;
    const uniqueIdNumber = `8203141234${String(timestamp).slice(-3)}`;
    
    console.log(`🆕 Registering new user with email: ${uniqueEmail}`);
    console.log(`🆔 Using ID Number: ${uniqueIdNumber}\n`);

    const form = new FormData();
    form.append('idNumber', uniqueIdNumber);
    form.append('email', uniqueEmail);
    form.append('phoneNumber', `012345${String(timestamp).slice(-4)}`);
    form.append('password', 'TempPassword123!');
    form.append('businessType', 'sole_trader');
    form.append('streetAddress', '123 Test Street');
    form.append('town', 'TestTown');
    form.append('city', 'Cape Town');
    form.append('province', 'Western Cape');
    form.append('postalCode', '8001');
    
    // Add multiple documents
    form.append('idDocument', testPdf, {
        filename: 'id_document.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('proofOfResidence', testPdf, {
        filename: 'proof_of_residence.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('bankStatement', testPdf, {
        filename: 'bank_statement.pdf',
        contentType: 'application/pdf'
    });

    console.log('📤 Sending registration request with documents...');
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cash-dnr-backend.onrender.com',
            port: 443,
            path: '/api/auth/citizen',
            method: 'POST',
            headers: form.getHeaders()
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\n📊 Registration Status: ${res.statusCode}`);
                
                if (res.statusCode === 201) {
                    console.log('✅ USER SUCCESSFULLY REGISTERED!');
                    try {
                        const response = JSON.parse(data);
                        console.log(`👤 User ID: ${response.user.id}`);
                        console.log(`📧 Email: ${response.user.email}`);
                        console.log(`🆔 ID Number: ${response.user.idNumber}`);
                        console.log(`🔑 JWT Token: ${response.token.substring(0, 50)}...`);
                        console.log(`📁 Files Uploaded: ${response.files ? response.files.length : 0}`);
                        
                        if (response.files) {
                            response.files.forEach(file => {
                                console.log(`  📄 ${file.file_type}: ${file.file_name}`);
                            });
                        }
                    } catch (e) {
                        console.log('✅ Registration successful (response parsing issue)');
                        console.log('Raw response:', data.substring(0, 200));
                    }
                } else {
                    console.log('❌ REGISTRATION FAILED');
                    console.log('Error response:', data);
                }
                
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (e) => {
            console.error('❌ Request error:', e.message);
            reject(e);
        });

        form.pipe(req);
    });
}

registerUniqueUser().catch(console.error);