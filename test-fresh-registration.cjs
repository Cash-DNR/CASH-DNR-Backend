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

async function registerNewUser() {
    // Generate unique timestamp for email but use valid SA ID format
    const timestamp = Date.now();
    const uniqueEmail = `newuser_${timestamp}@example.com`;
    // Valid SA ID format: YYMMDDGGGGSAAZ where:
    // YY = Year (90 = 1990)
    // MM = Month (03)
    // DD = Day (15) 
    // GGGG = Gender/Sequence (5000-9999 for male, 0000-4999 for female)
    // SA = Citizenship (08 = SA citizen)
    // Z = Check digit
    const validIdNumber = '9003155678088'; // Valid format SA ID
    
    console.log(`🆕 Registering new user with email: ${uniqueEmail}`);
    console.log(`🆔 Using valid SA ID Number: ${validIdNumber}\n`);

    const form = new FormData();
    form.append('idNumber', validIdNumber);
    form.append('email', uniqueEmail);
    form.append('phoneNumber', '0827654321');
    form.append('password', 'NewPassword123!');
    form.append('businessType', 'sole_trader');
    form.append('streetAddress', '456 Main Road');
    form.append('town', 'Observatory');
    form.append('city', 'Cape Town');
    form.append('province', 'Western Cape');
    form.append('postalCode', '7925');
    
    // Add multiple documents
    form.append('idDocument', testPdf, {
        filename: 'sa_id_document.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('proofOfResidence', testPdf, {
        filename: 'utility_bill.pdf',
        contentType: 'application/pdf'
    });
    
    form.append('bankStatement', testPdf, {
        filename: 'bank_statement_3months.pdf',
        contentType: 'application/pdf'
    });

    console.log('📤 Sending registration request with all required documents...');
    
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
                    console.log('🎉 USER SUCCESSFULLY REGISTERED!');
                    try {
                        const response = JSON.parse(data);
                        console.log(`\n👤 USER DETAILS:`);
                        console.log(`   • User ID: ${response.user.id}`);
                        console.log(`   • Email: ${response.user.email}`);
                        console.log(`   • ID Number: ${response.user.idNumber}`);
                        console.log(`   • Phone: ${response.user.phoneNumber}`);
                        console.log(`   • Business Type: ${response.user.businessType}`);
                        console.log(`   • City: ${response.user.city}`);
                        
                        console.log(`\n🔑 AUTHENTICATION:`);
                        console.log(`   • JWT Token: ${response.token.substring(0, 30)}...`);
                        
                        console.log(`\n📁 UPLOADED FILES:`);
                        if (response.files && response.files.length > 0) {
                            response.files.forEach((file, index) => {
                                console.log(`   ${index + 1}. ${file.file_type}: ${file.file_name} (${file.file_size} bytes)`);
                            });
                        } else {
                            console.log(`   • No files uploaded`);
                        }
                        
                        console.log(`\n✅ REGISTRATION COMPLETE - USER CAN NOW LOGIN!`);
                        
                    } catch (e) {
                        console.log('✅ Registration successful (response parsing issue)');
                        console.log('Raw response:', data.substring(0, 300));
                    }
                } else if (res.statusCode === 400) {
                    console.log('❌ REGISTRATION FAILED - BAD REQUEST');
                    console.log('Error details:', data);
                } else if (res.statusCode === 409) {
                    console.log('❌ REGISTRATION FAILED - USER ALREADY EXISTS');
                    console.log('Error details:', data);
                } else {
                    console.log(`❌ REGISTRATION FAILED - STATUS ${res.statusCode}`);
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

console.log('🚀 Starting fresh user registration test...\n');
registerNewUser().catch(console.error);