/**
 * Test Flexible Registration Flow
 * Tests the recommended user journey:
 * 1. Register with /api/auth/citizen (get JWT)
 * 2. Upload documents with /api/upload/registration-documents (using JWT)
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

// Test user data
const testUser = {
  idNumber: "8012094321085", // Christopher White (different user for testing)
  contactInfo: {
    email: `flextest.${Date.now()}@example.com`,
    phone: "+27 82 555 1234"
  },
  homeAddress: {
    streetAddress: "123 Test Street",
    town: "Sandton", 
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2196"
  },
  password: "TestPassword123!"
};

async function testFlexibleRegistration() {
  console.log('🚀 Testing Flexible Registration Flow\n');
  
  try {
    // Step 1: Basic Registration (Get JWT Token)
    console.log('Step 1: Basic Registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.error('❌ Registration failed:', error);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Registration Success!');
    console.log('   User ID:', registerResult.data.user.id);
    console.log('   Username:', registerResult.data.user.username);
    console.log('   JWT Token:', registerResult.data.token.substring(0, 30) + '...');
    console.log('   Verified Status:', registerResult.data.user.isVerified);

    const jwtToken = registerResult.data.token;

    // Step 2: Upload Documents (Using JWT Token)
    console.log('\nStep 2: Document Upload...');
    
    // Create test files
    const testFilesDir = './test-files';
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir);
    }

    // Create dummy PDF content for testing
    const idDocContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    const proofContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');

    fs.writeFileSync(path.join(testFilesDir, 'id_document.pdf'), idDocContent);
    fs.writeFileSync(path.join(testFilesDir, 'proof_of_residence.pdf'), proofContent);

    // Create form data with files
    const formData = new FormData();
    formData.append('id_document', fs.createReadStream(path.join(testFilesDir, 'id_document.pdf')), 'id_document.pdf');
    formData.append('proof_of_residence', fs.createReadStream(path.join(testFilesDir, 'proof_of_residence.pdf')), 'proof_of_residence.pdf');

    const uploadResponse = await fetch(`${BASE_URL}/api/upload/registration-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('❌ Document upload failed:', error);
      return;
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Document Upload Success!');
    console.log('   Files uploaded:', uploadResult.data.uploadedFiles.length);
    console.log('   Verification status:', uploadResult.data.userVerificationStatus);
    console.log('   Documents received:');
    Object.entries(uploadResult.data.documentsReceived).forEach(([type, received]) => {
      console.log(`     ${type}: ${received ? '✅' : '❌'}`);
    });

    // Cleanup test files
    try {
      fs.unlinkSync(path.join(testFilesDir, 'id_document.pdf'));
      fs.unlinkSync(path.join(testFilesDir, 'proof_of_residence.pdf'));
      fs.rmdirSync(testFilesDir);
    } catch (err) {
      // Ignore cleanup errors
    }

    console.log('\n🎉 Flexible Registration Flow Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registered and got immediate JWT access');
    console.log('   ✅ Documents uploaded successfully using JWT token');
    console.log('   ✅ Account enhanced with document verification');
    console.log('\n💡 This flow gives users:');
    console.log('   • Immediate access after registration');
    console.log('   • Flexibility to upload documents when convenient');
    console.log('   • Progressive account enhancement');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFlexibleRegistration();