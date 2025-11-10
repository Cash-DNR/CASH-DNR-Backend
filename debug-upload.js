/**
 * Test Auth and Upload Debug
 * Step-by-step debugging to isolate the upload issue
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function debugUploadIssue() {
  console.log('🔍 Debug Upload Issue\n');
  
  try {
    // Step 1: Register and get token
    const testUser = {
      idNumber: "8203141234089",
      contactInfo: {
        email: `debug.${Date.now()}@example.com`,
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

    console.log('Step 1: Register...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const registerResult = await registerResponse.json();
    console.log('✅ Registration Success - Token:', registerResult.data.token.substring(0, 30) + '...');
    
    const token = registerResult.data.token;

    // Step 2: Test auth with simple GET endpoint
    console.log('\nStep 2: Test Auth...');
    const authTestResponse = await fetch(`${BASE_URL}/api/upload/single`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Auth test status:', authTestResponse.status);
    if (authTestResponse.status === 405) {
      console.log('✅ Auth working (405 = Method Not Allowed for GET on POST endpoint)');
    } else if (authTestResponse.status === 401) {
      console.log('❌ Auth failed - token invalid');
      return;
    }

    // Step 3: Test with small text file upload
    console.log('\nStep 3: Test Small File Upload...');
    
    const testContent = 'This is a test file content for upload testing.';
    const testFilePath = './temp-test-file.txt';
    fs.writeFileSync(testFilePath, testContent);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-file.txt',
      contentType: 'text/plain'
    });

    const uploadResponse = await fetch(`${BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Upload status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload Success:', result.message);
    } else {
      const error = await uploadResponse.text();
      console.log('❌ Upload Failed:', error);
    }

    // Cleanup
    fs.unlinkSync(testFilePath);

    // Step 4: Test registration documents endpoint specifically
    console.log('\nStep 4: Test Registration Documents Endpoint...');
    
    // Create minimal PDF for testing
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n74\n%%EOF');
    
    const idPath = './temp-id.pdf';
    const proofPath = './temp-proof.pdf';
    fs.writeFileSync(idPath, pdfContent);
    fs.writeFileSync(proofPath, pdfContent);

    const regFormData = new FormData();
    regFormData.append('id_document', fs.createReadStream(idPath), 'id_document.pdf');
    regFormData.append('proof_of_residence', fs.createReadStream(proofPath), 'proof_of_residence.pdf');

    const regUploadResponse = await fetch(`${BASE_URL}/api/upload/registration-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...regFormData.getHeaders()
      },
      body: regFormData
    });

    console.log('Registration upload status:', regUploadResponse.status);
    
    if (regUploadResponse.ok) {
      const result = await regUploadResponse.json();
      console.log('✅ Registration Documents Upload Success:', result.message);
      console.log('   Files uploaded:', result.data.uploadedFiles?.length || 0);
      console.log('   Verification status:', result.data.userVerificationStatus);
    } else {
      const error = await regUploadResponse.text();
      console.log('❌ Registration Upload Failed:', error);
    }

    // Cleanup
    fs.unlinkSync(idPath);
    fs.unlinkSync(proofPath);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUploadIssue();