// Comprehensive test of all registration endpoints
import pkg from 'pg';
const { Client } = pkg;
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const BASE_URL = 'https://cash-dnr-backend.onrender.com';
const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';

// Test data for different citizens
const TEST_CITIZENS = [
  {
    id: '8203141234089',
    name: 'Michelle White',
    email: 'michelle.test@example.com',
    phone: '+27 82 555 1234'
  },
  {
    id: '8012094321085',
    name: 'Christopher White',
    email: 'christopher.test@example.com',
    phone: '+27 83 555 5678'
  }
];

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const log = {
  header: (text) => {
    console.log('\n' + '═'.repeat(70));
    console.log(`  ${text}`);
    console.log('═'.repeat(70));
  },
  section: (text) => {
    console.log('\n' + '─'.repeat(70));
    console.log(`📋 ${text}`);
    console.log('─'.repeat(70));
  },
  success: (text) => console.log(`✅ ${text}`),
  error: (text) => console.log(`❌ ${text}`),
  info: (text) => console.log(`ℹ️  ${text}`),
  warning: (text) => console.log(`⚠️  ${text}`)
};

// Database helper
async function cleanupTestUsers() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const emails = TEST_CITIZENS.map(c => c.email);
    const ids = TEST_CITIZENS.map(c => c.id);
    
    const result = await client.query(
      'DELETE FROM users WHERE email = ANY($1) OR id_number = ANY($2) RETURNING email, id_number',
      [emails, ids]
    );
    
    if (result.rowCount > 0) {
      log.info(`Cleaned up ${result.rowCount} test user(s)`);
      result.rows.forEach(row => {
        console.log(`   - ${row.email} (${row.id_number})`);
      });
    }
    
    await client.end();
    return true;
  } catch (error) {
    log.error(`Database cleanup failed: ${error.message}`);
    return false;
  }
}

// Test helper
function recordTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    log.success(name);
  } else {
    testResults.failed++;
    log.error(name);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

// TEST 1: Basic Citizen Registration (no files)
async function testBasicCitizenRegistration() {
  log.section('TEST 1: Basic Citizen Registration (POST /api/auth/citizen)');
  
  const citizen = TEST_CITIZENS[0];
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: citizen.id,
        contactInfo: {
          email: citizen.email,
          phone: citizen.phone
        },
        password: 'SecurePass123!',
        homeAddress: {
          streetAddress: '123 Main Street',
          town: 'Sandton',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2196'
        }
      })
    });

    const data = await response.json();
    
    if (response.status === 201 && data.success) {
      recordTest('Basic citizen registration', true, 
        `User: ${data.data.user.fullName} | ID: ${data.data.user.id}`);
      
      // Verify token was issued
      if (data.data.token) {
        log.success('JWT token issued');
      } else {
        log.warning('No JWT token in response');
      }
      
      // Verify Home Affairs verification
      if (data.data.user.homeAffairsVerified) {
        log.success('Home Affairs verified');
      } else {
        log.warning('Home Affairs verification flag not set');
      }
      
      return { success: true, userId: data.data.user.id, token: data.data.token };
    } else {
      recordTest('Basic citizen registration', false, 
        `Status: ${response.status} | Error: ${data.message || JSON.stringify(data)}`);
      return { success: false };
    }
  } catch (error) {
    recordTest('Basic citizen registration', false, error.message);
    return { success: false };
  }
}

// TEST 2: File Upload Registration
async function testFileUploadRegistration() {
  log.section('TEST 2: File Upload Registration (POST /api/auth/register-with-documents)');
  
  const citizen = TEST_CITIZENS[1];
  
  try {
    // Create form data
    const form = new FormData();
    
    form.append('idNumber', citizen.id);
    form.append('email', citizen.email);
    form.append('password', 'SecurePass123!');
    form.append('phoneNumber', citizen.phone);
    
    // Add address fields
    form.append('streetAddress', '456 Oak Avenue');
    form.append('town', 'Sandton');
    form.append('city', 'Johannesburg');
    form.append('province', 'Gauteng');
    form.append('postalCode', '2196');

    // Create dummy PDF files
    const tempDir = './tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF');
    
    const testFiles = [
      { name: 'test_id.pdf', field: 'id_document' },
      { name: 'test_residence.pdf', field: 'proof_of_residence' },
      { name: 'test_bank.pdf', field: 'bank_statement' }
    ];

    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.name);
      fs.writeFileSync(filePath, dummyPdf);
      const fileStream = fs.createReadStream(filePath);
      form.append(file.field, fileStream, file.name);
    }

    log.info('Uploading 3 documents...');

    const response = await fetch(`${BASE_URL}/api/auth/register-with-documents`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();
    
    if (response.status === 201 && data.success) {
      recordTest('File upload registration', true,
        `User: ${data.data.user.firstName} ${data.data.user.lastName} | Files: ${data.data.uploaded.length}`);
      
      // Verify files were uploaded
      if (data.data.uploaded && data.data.uploaded.length === 3) {
        log.success('All 3 files uploaded successfully');
        data.data.uploaded.forEach(f => {
          console.log(`   - ${f.fileType}: ${f.originalName}`);
        });
      }
      
      // Verify user is marked as verified (all required docs provided)
      if (data.data.user.isVerified) {
        log.success('User marked as verified (all required documents provided)');
      } else {
        log.warning('User not marked as verified');
      }
      
      return { success: true, userId: data.data.user.id };
    } else {
      recordTest('File upload registration', false,
        `Status: ${response.status} | Error: ${data.message || JSON.stringify(data)}`);
      return { success: false };
    }
  } catch (error) {
    recordTest('File upload registration', false, error.message);
    return { success: false };
  }
}

// TEST 3: Duplicate Registration Prevention
async function testDuplicatePrevention() {
  log.section('TEST 3: Duplicate Registration Prevention');
  
  const citizen = TEST_CITIZENS[0];
  
  try {
    // Try to register same ID again
    const response = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: citizen.id,
        contactInfo: {
          email: 'another.email@example.com',
          phone: '+27 84 999 9999'
        },
        password: 'SecurePass123!'
      })
    });

    const data = await response.json();
    
    // Should fail with 400
    if (response.status === 400 && !data.success) {
      recordTest('Duplicate ID number prevention', true,
        `Correctly rejected: ${data.message}`);
      return { success: true };
    } else {
      recordTest('Duplicate ID number prevention', false,
        `Should have been rejected but got status ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    recordTest('Duplicate ID number prevention', false, error.message);
    return { success: false };
  }
}

// TEST 4: Invalid ID Number
async function testInvalidIdNumber() {
  log.section('TEST 4: Invalid ID Number Handling');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: '1234567890123', // Invalid ID
        contactInfo: {
          email: 'invalid@example.com',
          phone: '+27 85 888 8888'
        },
        password: 'SecurePass123!'
      })
    });

    const data = await response.json();
    
    // Should fail with 400
    if (response.status === 400 && !data.success) {
      recordTest('Invalid ID number rejection', true,
        `Correctly rejected: ${data.message}`);
      return { success: true };
    } else {
      recordTest('Invalid ID number rejection', false,
        `Should have been rejected but got status ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    recordTest('Invalid ID number rejection', false, error.message);
    return { success: false };
  }
}

// TEST 5: Login with registered user (multi-step process)
async function testLogin(email, password, idNumber) {
  log.section('TEST 5: User Login (Multi-step with OTP)');
  
  try {
    // Step 1: Check email
    log.info('Step 1: Checking email...');
    const emailCheckResponse = await fetch(`${BASE_URL}/api/auth/login/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const emailCheckData = await emailCheckResponse.json();
    
    if (emailCheckResponse.status !== 200 || !emailCheckData.success) {
      recordTest('User login - email check', false,
        `Status: ${emailCheckResponse.status} | Error: ${emailCheckData.message}`);
      return { success: false };
    }
    
    log.success('Email found in system');
    
    // Step 2: Verify credentials
    log.info('Step 2: Verifying credentials...');
    const credentialsResponse = await fetch(`${BASE_URL}/api/auth/login/verify-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        identifier: idNumber,  // Add ID number as identifier
        password 
      })
    });

    const credentialsData = await credentialsResponse.json();
    
    if (credentialsResponse.status !== 200 || !credentialsData.success) {
      recordTest('User login - credentials verification', false,
        `Status: ${credentialsResponse.status} | Error: ${credentialsData.message || JSON.stringify(credentialsData)}`);
      return { success: false };
    }
    
    log.success('Credentials verified');
    log.info('OTP would be sent to phone (skipping OTP verification in test)');
    
    recordTest('User login (email check + credentials)', true,
      `Login flow successful for: ${email}`);
    
    return { success: true, sessionId: credentialsData.data?.sessionId };
  } catch (error) {
    recordTest('User login', false, error.message);
    return { success: false };
  }
}

// TEST 6: Database verification
async function testDatabaseVerification() {
  log.section('TEST 6: Database Verification');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if users exist
    const result = await client.query(
      'SELECT id, username, email, first_name, last_name, id_number, gender, home_affairs_verified, is_verified, is_active FROM users WHERE id_number = ANY($1)',
      [TEST_CITIZENS.map(c => c.id)]
    );
    
    if (result.rowCount === 2) {
      recordTest('Database verification', true,
        `Found ${result.rowCount} registered users in database`);
      
      result.rows.forEach(user => {
        console.log(`\n   User: ${user.first_name} ${user.last_name}`);
        console.log(`   ├─ ID: ${user.id}`);
        console.log(`   ├─ Email: ${user.email}`);
        console.log(`   ├─ ID Number: ${user.id_number}`);
        console.log(`   ├─ Gender: ${user.gender}`);
        console.log(`   ├─ Home Affairs Verified: ${user.home_affairs_verified ? '✓' : '✗'}`);
        console.log(`   ├─ Is Verified: ${user.is_verified ? '✓' : '✗'}`);
        console.log(`   └─ Is Active: ${user.is_active ? '✓' : '✗'}`);
      });
      
      // Check files
      const filesResult = await client.query(
        'SELECT user_id, file_type, original_name, file_size FROM files WHERE user_id IN (SELECT id FROM users WHERE id_number = ANY($1))',
        [TEST_CITIZENS.map(c => c.id)]
      );
      
      if (filesResult.rowCount > 0) {
        log.success(`Found ${filesResult.rowCount} uploaded files`);
        console.log('\n   Uploaded Files:');
        filesResult.rows.forEach(file => {
          console.log(`   - ${file.file_type}: ${file.original_name} (${file.file_size} bytes)`);
        });
      }
      
    } else {
      recordTest('Database verification', false,
        `Expected 2 users, found ${result.rowCount}`);
    }
    
    await client.end();
    return { success: true };
  } catch (error) {
    recordTest('Database verification', false, error.message);
    return { success: false };
  }
}

// Main test execution
async function runFullTest() {
  log.header('🧪 COMPREHENSIVE REGISTRATION SYSTEM TEST');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Test Citizens: ${TEST_CITIZENS.length}`);
  console.log(`Database: Production (cash_dnr)\n`);

  // Cleanup
  log.header('STEP 0: Cleanup Previous Test Data');
  await cleanupTestUsers();

  // Run tests
  log.header('RUNNING TESTS');
  
  const test1 = await testBasicCitizenRegistration();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
  
  const test2 = await testFileUploadRegistration();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testDuplicatePrevention();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testInvalidIdNumber();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test login if registration succeeded
  if (test1.success) {
    await testLogin(TEST_CITIZENS[0].email, 'SecurePass123!', TEST_CITIZENS[0].id);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await testDatabaseVerification();

  // Summary
  log.header('TEST SUMMARY');
  console.log(`\nTotal Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%\n`);
  
  if (testResults.failed === 0) {
    log.header('🎉 ALL TESTS PASSED! SYSTEM IS FULLY OPERATIONAL!');
  } else {
    log.header('⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}`);
      if (t.details) console.log(`      ${t.details}`);
    });
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

// Execute
runFullTest().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});