// Delete existing user and show full registration request/response
import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';

const fullRegistrationFlow = async () => {
  // Step 1: Delete existing user
  console.log('🗑️  Step 1: Cleaning up existing user...\n');
  
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

  // Step 2: Fresh registration with full request/response display
  console.log('═'.repeat(70));
  console.log('🚀 CITIZEN REGISTRATION API - COMPLETE REQUEST & RESPONSE');
  console.log('═'.repeat(70));
  
  const requestBody = {
    idNumber: '8203141234089',
    contactInfo: {
      email: 'michelle.white@example.com',
      phone: '+27 82 555 1234'
    },
    homeAddress: {
      streetAddress: '456 Oak Avenue',
      town: 'Sandton',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196'
    },
    password: 'SecurePass123!'
  };

  console.log('\n📤 REQUEST:');
  console.log('─'.repeat(70));
  console.log('Method: POST');
  console.log('URL: https://cash-dnr-backend.onrender.com/api/auth/citizen');
  console.log('Headers:');
  console.log('  Content-Type: application/json');
  console.log('\n📋 REQUEST BODY:');
  console.log(JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseBody = await response.json();
    
    console.log('\n' + '═'.repeat(70));
    console.log('📥 RESPONSE:');
    console.log('─'.repeat(70));
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Date: ${response.headers.get('date')}`);
    
    console.log('\n📋 RESPONSE BODY:');
    console.log(JSON.stringify(responseBody, null, 2));

    console.log('\n' + '═'.repeat(70));
    if (response.status === 201) {
      console.log('✅ SUCCESS - REGISTRATION COMPLETE!');
      console.log('═'.repeat(70));
      console.log('\n📊 Summary:');
      console.log(`   User ID: ${responseBody.data?.user?.id}`);
      console.log(`   Name: ${responseBody.data?.user?.fullName}`);
      console.log(`   Email: ${responseBody.data?.user?.email}`);
      console.log(`   ID Number: ${responseBody.data?.user?.idNumber}`);
      console.log(`   Gender: ${responseBody.data?.user?.gender}`);
      console.log(`   Home Affairs Verified: ${responseBody.data?.user?.homeAffairsVerified}`);
      console.log(`   JWT Token Length: ${responseBody.data?.token?.length} characters`);
    } else {
      console.log('❌ REGISTRATION FAILED');
      console.log('═'.repeat(70));
    }

  } catch (error) {
    console.error('\n❌ REQUEST FAILED:', error.message);
  }
};

fullRegistrationFlow();