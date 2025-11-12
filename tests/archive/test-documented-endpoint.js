// Simple test for the documented file upload registration endpoint
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

// Test data using the documented test ID
const TEST_USER = {
  id: '8203141234089',
  name: 'Michelle White',
  email: 'test.registration@example.com',
  phone: '+27 82 555 1234'
};

async function testDocumentedEndpoint() {
  console.log('🧪 Testing Documented Registration Endpoint');
  console.log('═'.repeat(60));
  console.log(`📍 Endpoint: POST ${BASE_URL}/api/auth/register-with-documents`);
  console.log(`👤 Test User: ${TEST_USER.name} (${TEST_USER.id})`);
  console.log('');

  try {
    // Create form data exactly as documented
    const form = new FormData();
    
    // Add required text fields
    form.append('idNumber', TEST_USER.id);
    form.append('email', TEST_USER.email);
    form.append('password', 'TestPassword123!');
    form.append('phoneNumber', TEST_USER.phone);

    console.log('📝 Form Data:');
    console.log(`   - idNumber: ${TEST_USER.id}`);
    console.log(`   - email: ${TEST_USER.email}`);
    console.log(`   - phoneNumber: ${TEST_USER.phone}`);
    console.log(`   - password: [hidden]`);

    // Create dummy files as documented
    const tempDir = './tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Simple PDF content
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF');
    
    // Required files as per documentation
    const requiredFiles = [
      { name: 'id_document.pdf', field: 'id_document', required: true },
      { name: 'proof_of_residence.pdf', field: 'proof_of_residence', required: true }
    ];

    // Optional file
    const optionalFiles = [
      { name: 'bank_statement.pdf', field: 'bank_statement', required: false }
    ];

    const allFiles = [...requiredFiles, ...optionalFiles];

    console.log('\n📁 Files to Upload:');
    for (const file of allFiles) {
      const filePath = path.join(tempDir, file.name);
      fs.writeFileSync(filePath, dummyPdf);
      const fileStream = fs.createReadStream(filePath);
      form.append(file.field, fileStream, file.name);
      console.log(`   - ${file.field}: ${file.name} ${file.required ? '(Required)' : '(Optional)'}`);
    }

    console.log('\n⏳ Sending registration request...');
    console.log('');

    // Make the request
    const response = await fetch(`${BASE_URL}/api/auth/register-with-documents`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    
    if (response.status === 201 && data.success) {
      console.log('✅ SUCCESS - Registration completed!');
      console.log('');
      console.log('👤 User Created:');
      console.log(`   - ID: ${data.data.user.id}`);
      console.log(`   - Username: ${data.data.user.username}`);
      console.log(`   - Email: ${data.data.user.email}`);
      console.log(`   - Full Name: ${data.data.user.firstName} ${data.data.user.lastName}`);
      console.log(`   - ID Number: ${data.data.user.idNumber}`);
      console.log(`   - Gender: ${data.data.user.gender}`);
      console.log(`   - Date of Birth: ${data.data.user.dateOfBirth}`);
      console.log(`   - Home Affairs Verified: ${data.data.user.homeAffairsVerified ? '✓' : '✗'}`);
      console.log(`   - Account Verified: ${data.data.user.isVerified ? '✓' : '✗'}`);
      console.log(`   - Tax Number: ${data.data.user.taxNumber}`);
      
      console.log('\n📎 Files Uploaded:');
      if (data.data.uploaded && data.data.uploaded.length > 0) {
        data.data.uploaded.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.fileType}`);
          console.log(`      - Original: ${file.originalName}`);
          console.log(`      - Stored: ${file.storedName}`);
          console.log(`      - ID: ${file.id}`);
        });
        console.log(`\n📈 Total Files Uploaded: ${data.data.uploaded.length}`);
      } else {
        console.log('   No files in response');
      }

      // Cleanup temp files
      try {
        for (const file of allFiles) {
          const filePath = path.join(tempDir, file.name);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        console.log('\n🧹 Cleaned up temporary files');
      } catch (cleanupError) {
        console.log('⚠️  Warning: Could not cleanup temp files');
      }

      console.log('\n🎉 Test completed successfully!');
      console.log('');
      console.log('📋 Next Steps for Frontend:');
      console.log('   1. Use this exact FormData structure');
      console.log('   2. Handle the success response format shown above');
      console.log('   3. Display user info and uploaded file count');
      console.log('   4. Redirect to dashboard/login as needed');
      
    } else {
      console.log('❌ FAILED - Registration failed');
      console.log('');
      console.log('📋 Error Details:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${data.success}`);
      console.log(`   - Message: ${data.message || 'No error message'}`);
      console.log(`   - Details: ${data.details || 'No additional details'}`);
      
      if (data.missing) {
        console.log(`   - Missing Fields: ${JSON.stringify(data.missing)}`);
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify all required fields are present');
      console.log('   2. Check that ID number is exactly 13 digits');
      console.log('   3. Ensure both id_document and proof_of_residence files are attached');
      console.log('   4. Verify production server is running and updated');
    }

  } catch (error) {
    console.log('💥 NETWORK ERROR');
    console.log('');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('🔧 Possible Causes:');
    console.log('   1. Production server is down');
    console.log('   2. Network connectivity issues');
    console.log('   3. Endpoint URL has changed');
    console.log('   4. CORS issues (check browser console if testing from web)');
  }

  console.log('\n' + '═'.repeat(60));
}

// Run the test
testDocumentedEndpoint().catch(error => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});