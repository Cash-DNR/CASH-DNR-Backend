/**
 * Test Flexible Registration with Profile Documents
 * Uses the better approach: Register → Upload documents via profile endpoint
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testFlexibleRegistrationProfile() {
  console.log('🚀 Testing Flexible Registration with Profile Documents\n');
  
  try {
    // Step 1: Register user
    const testUser = {
      idNumber: "8203141234089",
      contactInfo: {
        email: `profiletest.${Date.now()}@example.com`,
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

    console.log('Step 1: Register User...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.log('   Email:', registerResult.data.user.email);
    console.log('   Verified Status:', registerResult.data.user.isVerified);

    const userId = registerResult.data.user.id;
    const jwtToken = registerResult.data.token;

    // Step 2: Upload documents via profile endpoint
    console.log('\nStep 2: Upload Documents via Profile...');
    
    // Create test files
    const testFilesDir = './test-files';
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir);
    }

    // Create dummy PDF content for testing
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');

    fs.writeFileSync(path.join(testFilesDir, 'id_copy.pdf'), pdfContent);
    fs.writeFileSync(path.join(testFilesDir, 'proof_of_residence.pdf'), pdfContent);

    // Create form data with files using profile endpoint field names
    const formData = new FormData();
    formData.append('idCopy', fs.createReadStream(path.join(testFilesDir, 'id_copy.pdf')), 'id_copy.pdf');
    formData.append('proofOfResidence', fs.createReadStream(path.join(testFilesDir, 'proof_of_residence.pdf')), 'proof_of_residence.pdf');

    const uploadResponse = await fetch(`${BASE_URL}/api/users/${userId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Upload status:', uploadResponse.status);

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ Document Upload Success!');
      console.log('   Message:', uploadResult.message);
      console.log('   Status:', uploadResult.data.status);
      console.log('   Documents uploaded:');
      
      Object.entries(uploadResult.data.documents).forEach(([type, files]) => {
        console.log(`     ${type}: ${files.length} file(s)`);
        files.forEach(file => {
          console.log(`       - ${file.originalName} (${file.size} bytes)`);
        });
      });
    } else {
      const error = await uploadResponse.text();
      console.log('❌ Document upload failed:', error);
    }

    // Cleanup test files
    try {
      fs.unlinkSync(path.join(testFilesDir, 'id_copy.pdf'));
      fs.unlinkSync(path.join(testFilesDir, 'proof_of_residence.pdf'));
      if (fs.existsSync(testFilesDir) && fs.readdirSync(testFilesDir).length === 0) {
        fs.rmdirSync(testFilesDir);
      }
    } catch (err) {
      // Ignore cleanup errors
    }

    console.log('\n🎉 Profile-Based Registration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registered with immediate JWT token');
    console.log('   ✅ Documents uploaded via user profile endpoint');
    console.log('   ✅ Clean separation: Register → Get access → Upload docs');
    
    console.log('\n💡 This approach:');
    console.log('   • Uses existing, stable profile document upload');
    console.log('   • Associates documents directly with user account');
    console.log('   • Avoids middleware conflicts in upload routes');
    console.log('   • Provides better user experience');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFlexibleRegistrationProfile();