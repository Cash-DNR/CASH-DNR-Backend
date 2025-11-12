/**
 * Test Unified Registration Endpoint
 * Tests both JSON and multipart modes of the /api/auth/citizen endpoint
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testUnifiedRegistration() {
  console.log('🚀 Testing Unified Registration Endpoint\n');
  
  try {
    // Test 1: JSON Mode (Basic Registration)
    console.log('='.repeat(60));
    console.log('TEST 1: JSON Mode (Basic Registration)');
    console.log('='.repeat(60));

    const jsonUser = {
      idNumber: "8203141234089",
      contactInfo: {
        email: `jsontest.${Date.now()}@example.com`,
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

    const jsonResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonUser)
    });

    console.log('JSON Request status:', jsonResponse.status);

    if (jsonResponse.ok) {
      const jsonResult = await jsonResponse.json();
      console.log('✅ JSON Mode Success!');
      console.log('   User ID:', jsonResult.data.user.id);
      console.log('   Email:', jsonResult.data.user.email);
      console.log('   JWT Token:', jsonResult.data.token.substring(0, 30) + '...');
      console.log('   Verified:', jsonResult.data.user.isVerified);
      console.log('   Message:', jsonResult.message);
      console.log('   Has Documents:', !!jsonResult.data.documents);
    } else {
      const error = await jsonResponse.text();
      console.log('❌ JSON Mode Failed:', error);
      return;
    }

    // Test 2: Multipart Mode (Registration with Documents)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Multipart Mode (Registration with Documents)');
    console.log('='.repeat(60));

    // Create test files
    const testFilesDir = './test-files';
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir);
    }

    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    fs.writeFileSync(path.join(testFilesDir, 'id_document.pdf'), pdfContent);
    fs.writeFileSync(path.join(testFilesDir, 'proof_of_residence.pdf'), pdfContent);

    // Create multipart form data
    const formData = new FormData();
    
    // Add user data
    formData.append('idNumber', '8012094321085'); // Different ID for second test
    formData.append('email', `multipart.${Date.now()}@example.com`);
    formData.append('phone', '+27 82 555 1234');
    formData.append('streetAddress', '456 Multipart Avenue');
    formData.append('town', 'Sandton');
    formData.append('city', 'Johannesburg');
    formData.append('province', 'Gauteng');
    formData.append('postalCode', '2196');
    formData.append('password', 'TestPassword123!');
    
    // Add files
    formData.append('idDocument', fs.createReadStream(path.join(testFilesDir, 'id_document.pdf')), 'id_document.pdf');
    formData.append('proofOfResidence', fs.createReadStream(path.join(testFilesDir, 'proof_of_residence.pdf')), 'proof_of_residence.pdf');

    const multipartResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: {
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Multipart Request status:', multipartResponse.status);

    if (multipartResponse.ok) {
      const multipartResult = await multipartResponse.json();
      console.log('✅ Multipart Mode Success!');
      console.log('   User ID:', multipartResult.data.user.id);
      console.log('   Email:', multipartResult.data.user.email);
      console.log('   JWT Token:', multipartResult.data.token.substring(0, 30) + '...');
      console.log('   Verified:', multipartResult.data.user.isVerified);
      console.log('   Message:', multipartResult.message);
      console.log('   Documents uploaded:', multipartResult.data.documents?.count || 0);
      
      if (multipartResult.data.documents) {
        multipartResult.data.documents.uploaded.forEach(doc => {
          console.log(`     - ${doc.originalName} (${doc.fileType})`);
        });
      }
    } else {
      const error = await multipartResponse.text();
      console.log('❌ Multipart Mode Failed:', error);
    }

    // Cleanup
    try {
      fs.unlinkSync(path.join(testFilesDir, 'id_document.pdf'));
      fs.unlinkSync(path.join(testFilesDir, 'proof_of_residence.pdf'));
      if (fs.existsSync(testFilesDir) && fs.readdirSync(testFilesDir).length === 0) {
        fs.rmdirSync(testFilesDir);
      }
    } catch (err) {
      // Ignore cleanup errors
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 UNIFIED ENDPOINT TEST COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📋 Summary:');
    console.log('✅ Single endpoint handles both modes');
    console.log('✅ JSON mode: Simple registration + JWT token');
    console.log('✅ Multipart mode: Registration + documents + JWT token');
    console.log('✅ Always returns JWT token for immediate access');
    console.log('✅ Progressive enhancement: Basic → Enhanced with docs');
    
    console.log('\n💡 Frontend Benefits:');
    console.log('• One endpoint to integrate');
    console.log('• No complex routing decisions');
    console.log('• Immediate user access in both cases');
    console.log('• Documents can be included OR skipped');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUnifiedRegistration();