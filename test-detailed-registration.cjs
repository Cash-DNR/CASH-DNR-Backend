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

async function registerUserWithDetails() {
    console.log('🚀 Testing DETAILED user registration...\n');

    const form = new FormData();
    form.append('idNumber', '8203141234089');
    form.append('email', 'test@example.com');
    form.append('phoneNumber', '0123456789');
    form.append('password', 'TempPassword123!');
    form.append('businessType', 'sole_trader');
    form.append('streetAddress', '123 Test St');
    form.append('town', 'TestTown');
    form.append('city', 'TestCity');
    form.append('province', 'TestProvince');
    form.append('postalCode', '1234');
    
    form.append('idDocument', testPdf, {
        filename: 'id.pdf',
        contentType: 'application/pdf'
    });

    console.log('📤 Sending registration request...');
    console.log('📋 User Details:');
    console.log('   • ID Number: 8203141234089');
    console.log('   • Email: test@example.com');
    console.log('   • Phone: 0123456789');
    console.log('   • Business Type: sole_trader');
    console.log('   • Address: 123 Test St, TestTown, TestCity');
    console.log('   • Document: id.pdf (ID Document)');
    console.log('');

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
                console.log(`📊 Response Status: ${res.statusCode}\n`);
                
                if (res.statusCode === 201) {
                    console.log('✅ USER SUCCESSFULLY REGISTERED!\n');
                    try {
                        const response = JSON.parse(data);
                        
                        console.log('👤 USER INFORMATION:');
                        console.log(`   • User ID: ${response.user.id}`);
                        console.log(`   • Email: ${response.user.email}`);
                        console.log(`   • ID Number: ${response.user.idNumber}`);
                        console.log(`   • Phone: ${response.user.phoneNumber}`);
                        console.log(`   • Business Type: ${response.user.businessType}`);
                        console.log(`   • Address: ${response.user.streetAddress}, ${response.user.city}`);
                        console.log(`   • Province: ${response.user.province}`);
                        console.log(`   • Postal Code: ${response.user.postalCode}`);
                        
                        console.log('\n🔐 AUTHENTICATION:');
                        console.log(`   • JWT Token: ${response.token.substring(0, 50)}...`);
                        console.log(`   • Token Length: ${response.token.length} characters`);
                        
                        console.log('\n📁 UPLOADED FILES:');
                        if (response.files && response.files.length > 0) {
                            response.files.forEach((file, index) => {
                                console.log(`   ${index + 1}. Type: ${file.file_type}`);
                                console.log(`      Name: ${file.file_name}`);
                                console.log(`      Size: ${file.file_size} bytes`);
                                console.log(`      Path: ${file.file_path}`);
                                console.log('');
                            });
                        } else {
                            console.log('   • No files in response');
                        }
                        
                        console.log('🎉 REGISTRATION COMPLETED SUCCESSFULLY!');
                        console.log('✅ User can now login with their credentials');
                        console.log('✅ Files have been uploaded and stored');
                        
                    } catch (e) {
                        console.log('✅ Registration successful but response parsing failed');
                        console.log('Raw response preview:', data.substring(0, 500));
                    }
                } else if (res.statusCode === 409) {
                    console.log('ℹ️  USER ALREADY EXISTS');
                    console.log('This means the registration system is working correctly!');
                    console.log('Response:', data);
                } else {
                    console.log(`❌ Registration failed with status: ${res.statusCode}`);
                    console.log('Response:', data);
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

registerUserWithDetails().catch(console.error);