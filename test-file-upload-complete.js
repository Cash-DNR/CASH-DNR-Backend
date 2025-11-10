// Delete user and test file upload registration
import pkg from 'pg';
const { Client } = pkg;
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const deleteAndTestFileUpload = async () => {
  console.log('═'.repeat(70));
  console.log('🗑️  STEP 1: Delete existing user');
  console.log('═'.repeat(70));
  
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  const idNumber = '8203141234089';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const deleteResult = await client.query(
      'DELETE FROM users WHERE id_number = $1 RETURNING email',
      [idNumber]
    );
    
    if (deleteResult.rowCount > 0) {
      console.log(`✅ Deleted: ${deleteResult.rows[0].email}\n`);
    } else {
      console.log('✅ No existing user found\n');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return;
  }

  // Now test file upload registration
  console.log('═'.repeat(70));
  console.log('📤 STEP 2: Test file upload registration');
  console.log('═'.repeat(70));
  console.log('\nID Number: 8203141234089 (Michelle White)');
  console.log('Endpoint: POST /api/auth/register-with-documents\n');

  // Create form data
  const form = new FormData();
  
  // Add user information
  form.append('idNumber', '8203141234089');
  form.append('email', 'michelle.upload@example.com');
  form.append('password', 'SecurePass123!');
  form.append('phoneNumber', '+27 82 555 1234');
  
  // Add address fields
  form.append('streetAddress', '456 Oak Avenue');
  form.append('town', 'Sandton');
  form.append('city', 'Johannesburg');
  form.append('province', 'Gauteng');
  form.append('postalCode', '2196');

  // Create temporary test files
  const tempDir = './tmp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create dummy PDF content (minimal valid PDF)
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF');
  
  const testFiles = [
    { name: 'michelle_id.pdf', field: 'id_document' },
    { name: 'michelle_residence.pdf', field: 'proof_of_residence' },
    { name: 'michelle_bank.pdf', field: 'bank_statement' }
  ];

  console.log('📎 Creating test files:');
  for (const file of testFiles) {
    const filePath = path.join(tempDir, file.name);
    fs.writeFileSync(filePath, dummyPdf);
    const fileStream = fs.createReadStream(filePath);
    form.append(file.field, fileStream, file.name);
    console.log(`   ✓ ${file.name} → ${file.field}`);
  }

  console.log('\n📤 Sending registration request with files...\n');

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/register-with-documents', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('═'.repeat(70));
    console.log('📥 RESPONSE');
    console.log('═'.repeat(70));
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      console.log('📋 Response Body:');
      console.log(JSON.stringify(data, null, 2));

      if (response.status === 201 || response.status === 200) {
        console.log('\n' + '═'.repeat(70));
        console.log('🎉 SUCCESS! FILE UPLOAD REGISTRATION WORKING!');
        console.log('═'.repeat(70));
        
        if (data.data?.user) {
          console.log('\n✅ User Created:');
          console.log(`   ID: ${data.data.user.id}`);
          console.log(`   Name: ${data.data.user.fullName}`);
          console.log(`   Email: ${data.data.user.email}`);
          console.log(`   ID Number: ${data.data.user.idNumber}`);
          console.log(`   Gender: ${data.data.user.gender}`);
          console.log(`   Home Affairs Verified: ${data.data.user.homeAffairsVerified}`);
        }
        
        if (data.data?.files && data.data.files.length > 0) {
          console.log(`\n✅ Files Uploaded: ${data.data.files.length}`);
          data.data.files.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.file_category}: ${file.original_name} (${(file.file_size / 1024).toFixed(2)} KB)`);
          });
        }
        
        if (data.data?.token) {
          console.log(`\n✅ JWT Token: Generated (${data.data.token.length} chars)`);
        }
        
        console.log('\n' + '═'.repeat(70));
        console.log('✅ File upload endpoint is now fully functional!');
        console.log('✅ Middleware conflicts resolved!');
        console.log('═'.repeat(70));
        
      } else if (response.status === 400) {
        console.log('\n⚠️  Registration Failed - Validation Error');
        console.log('Details:', data.message || data.details);
        
        if (data.message === 'ID verification failed') {
          console.log('\n💡 This might be due to:');
          console.log('   - Home Affairs API rate limiting');
          console.log('   - Invalid ID number');
          console.log('   - API temporarily unavailable');
        }
      } else {
        console.log('\n❌ Registration Failed');
      }

    } catch (parseError) {
      console.log('📋 Raw Response:');
      console.log(responseText);
    }

  } catch (error) {
    console.error('\n❌ Request Failed:', error.message);
  }
};

deleteAndTestFileUpload();