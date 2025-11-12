import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testMultipartOnly() {
  console.log('🔍 Testing ONLY multipart upload with minimal data...\n');

  // Create a small valid PDF
  const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
  fs.writeFileSync('./minimal-test.pdf', pdfContent);

  const formData = new FormData();
  
  // Add only required fields
  formData.append('idNumber', '8012094321085');
  formData.append('email', `minimal.${Date.now()}@example.com`);
  formData.append('phone', '+27 82 555 1234');
  formData.append('streetAddress', '123 Test St');
  formData.append('town', 'TestTown');
  formData.append('city', 'TestCity');
  formData.append('province', 'TestProvince');
  formData.append('postalCode', '1234');
  formData.append('password', 'TestPass123!');
  
  // Add one small PDF file
  formData.append('idDocument', fs.createReadStream('./minimal-test.pdf'), {
    filename: 'minimal-test.pdf',
    contentType: 'application/pdf'
  });

  console.log('📤 Sending minimal multipart request...');
  console.log('Content-Type:', formData.getHeaders()['content-type']);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: {
        ...formData.getHeaders()
      },
      body: formData
    });

    const status = response.status;
    console.log(`📊 Response Status: ${status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📊 Response Body:`, responseText);

    // Cleanup
    fs.unlinkSync('./minimal-test.pdf');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('❌ Error details:', error);
    
    // Cleanup
    if (fs.existsSync('./minimal-test.pdf')) {
      fs.unlinkSync('./minimal-test.pdf');
    }
  }
}

testMultipartOnly();