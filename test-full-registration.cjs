const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFullRegistration() {
    const base_url = 'https://cash-dnr-backend.onrender.com';
    
    console.log('🚀 Testing Full User Registration with File Uploads...\n');
    
    // Clean up first - delete existing test user
    try {
        const deleteResponse = await fetch(`${base_url}/api/admin/delete-test-user`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('🗑️ Clean up response:', deleteResponse.status);
    } catch (e) {
        console.log('⚠️ Clean up warning:', e.message);
    }
    
    // Create a test PDF file for upload
    const testPdfPath = path.join(__dirname, 'test_id_document.pdf');
    if (!fs.existsSync(testPdfPath)) {
        console.log('📄 Creating test PDF document...');
        fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF');
    }
    
    // Prepare form data
    const form = new FormData();
    
    // Generate unique identifiers
    const timestamp = Date.now();
    const uniqueEmail = `testuser${timestamp}@example.com`;
    const uniqueNationalId = `${timestamp}`.slice(-13).padStart(13, '9');
    const uniqueTaxNumber = `TAX${timestamp}`;
    const uniqueRegNumber = `REG${timestamp}`;
    
    // User data
    form.append('firstName', 'Test');
    form.append('lastName', 'User');
    form.append('email', uniqueEmail);
    form.append('password', 'TestPassword123!');
    form.append('confirmPassword', 'TestPassword123!');
    form.append('phoneNumber', '+27123456789');
    form.append('dateOfBirth', '1990-01-01');
    form.append('nationalId', uniqueNationalId);
    form.append('address', '123 Test Street, Test City, 1234');
    form.append('taxNumber', uniqueTaxNumber);
    form.append('businessName', 'Test Business');
    form.append('businessType', 'individual');
    form.append('businessRegistrationNumber', uniqueRegNumber);
    
    // File upload
    form.append('idDocument', fs.createReadStream(testPdfPath));
    
    console.log('📋 Prepared registration data:');
    console.log('- firstName:', 'Test');
    console.log('- lastName:', 'User');
    console.log('- email:', uniqueEmail);
    console.log('- phoneNumber:', '+27123456789');
    console.log('- businessName:', 'Test Business');
    console.log('- idDocument: test_id_document.pdf\n');
    
    try {
        console.log('📤 Sending registration request...');
        const startTime = Date.now();
        
        const response = await fetch(`${base_url}/api/auth/citizen`, {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders()
            }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Request completed in ${duration}ms`);
        console.log('📊 Response Status:', response.status, response.statusText);
        
        const result = await response.text();
        
        let jsonResult;
        try {
            jsonResult = JSON.parse(result);
        } catch (e) {
            console.log('📄 Raw Response:', result);
            return;
        }
        
        if (response.status === 201) {
            console.log('✅ SUCCESS! User registration completed');
            console.log('🎉 Response Data:');
            console.log('- User ID:', jsonResult.user?.id);
            console.log('- Email:', jsonResult.user?.email);
            console.log('- Business Name:', jsonResult.user?.businessName);
            console.log('- Token Present:', !!jsonResult.token);
            console.log('- Files Uploaded:', jsonResult.files?.length || 0);
            
            if (jsonResult.files && jsonResult.files.length > 0) {
                console.log('📁 Uploaded Files:');
                jsonResult.files.forEach(file => {
                    console.log(`  - ${file.originalName} (${file.category})`);
                });
            }
        } else {
            console.log('❌ FAILED! Registration failed');
            console.log('🚫 Error Details:', jsonResult);
        }
        
    } catch (error) {
        console.error('💥 Request Error:', error.message);
        if (error.code) {
            console.error('🔧 Error Code:', error.code);
        }
    }
    
    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath);
        console.log('\n🧹 Cleaned up test file');
    }
}

// Run the test
testFullRegistration().then(() => {
    console.log('\n🏁 Test completed!');
}).catch(error => {
    console.error('💥 Test failed:', error);
});