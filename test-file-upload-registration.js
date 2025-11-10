// Test file upload registration for ID 8203141234089
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const testFileUploadRegistration = async () => {
  console.log('═'.repeat(70));
  console.log('🧪 TESTING FILE UPLOAD REGISTRATION');
  console.log('═'.repeat(70));
  console.log('\nID Number: 8203141234089 (Michelle White)');
  console.log('Endpoint: POST /api/auth/register-with-documents\n');

  // Create form data
  const form = new FormData();
  
  // Add user information
  form.append('idNumber', '8203141234089');
  form.append('email', 'michelle.upload.test@example.com');
  form.append('password', 'SecurePass123!');
  form.append('phoneNumber', '+27 82 555 1234');
  
  // Add address fields
  form.append('streetAddress', '456 Oak Avenue');
  form.append('town', 'Sandton');
  form.append('city', 'Johannesburg');
  form.append('province', 'Gauteng');
  form.append('postalCode', '2196');

  // Check if we have test files to upload
  const testFilesDir = './uploads';
  let hasFiles = false;

  // Try to find any existing files in uploads directory to use as test files
  if (fs.existsSync(testFilesDir)) {
    const categories = ['id_documents', 'proof_of_address', 'bank_statements', 'other'];
    
    for (const category of categories) {
      const categoryDir = path.join(testFilesDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir);
        if (files.length > 0) {
          const testFile = path.join(categoryDir, files[0]);
          console.log(`📎 Found test file: ${files[0]} in ${category}`);
          
          // Map category to field name
          const fieldMap = {
            'id_documents': 'id_document',
            'proof_of_address': 'proof_of_residence',
            'bank_statements': 'bank_statement',
            'other': 'other_documents'
          };
          
          try {
            const fileStream = fs.createReadStream(testFile);
            form.append(fieldMap[category], fileStream, files[0]);
            hasFiles = true;
            console.log(`   ✓ Added as ${fieldMap[category]}`);
          } catch (error) {
            console.log(`   ✗ Failed to read: ${error.message}`);
          }
        }
      }
    }
  }

  if (!hasFiles) {
    console.log('\n⚠️  No existing files found in uploads directory');
    console.log('Creating dummy test files...\n');
    
    // Create temporary test files
    const tempDir = './tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create dummy PDF content (minimal valid PDF)
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF');
    
    const testFiles = [
      { name: 'test_id_document.pdf', field: 'id_document' },
      { name: 'test_proof_of_residence.pdf', field: 'proof_of_residence' },
      { name: 'test_bank_statement.pdf', field: 'bank_statement' }
    ];

    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.name);
      fs.writeFileSync(filePath, dummyPdf);
      const fileStream = fs.createReadStream(filePath);
      form.append(file.field, fileStream, file.name);
      console.log(`📎 Created dummy file: ${file.name}`);
      console.log(`   ✓ Added as ${file.field}`);
    }
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
        console.log('\n🎉 SUCCESS! Registration with files completed!');
        console.log('═'.repeat(70));
        if (data.data?.user) {
          console.log('✅ User Created:');
          console.log(`   Name: ${data.data.user.fullName}`);
          console.log(`   Email: ${data.data.user.email}`);
          console.log(`   ID: ${data.data.user.id}`);
          console.log(`   Home Affairs Verified: ${data.data.user.homeAffairsVerified}`);
        }
        if (data.data?.files) {
          console.log(`\n✅ Files Uploaded: ${data.data.files.length}`);
          data.data.files.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.file_category}: ${file.original_name}`);
          });
        }
      } else if (response.status === 400) {
        console.log('\n⚠️  Registration Failed - Validation Error');
        if (data.message?.includes('already registered')) {
          console.log('💡 User already exists - try deleting first');
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
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running');
    }
  }
};

testFileUploadRegistration();