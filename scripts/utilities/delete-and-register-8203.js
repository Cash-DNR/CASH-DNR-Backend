// Delete existing user 8203141234089 and register fresh
import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';

const deleteAndRegister = async () => {
  console.log('🗑️  Deleting existing user 8203141234089...\n');
  
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  const idNumber = '8203141234089';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Delete user with this ID
    const deleteResult = await client.query(
      'DELETE FROM users WHERE id_number = $1 RETURNING id, email, first_name, last_name',
      [idNumber]
    );
    
    if (deleteResult.rowCount > 0) {
      console.log('✅ Deleted existing user:');
      console.log(`   Name: ${deleteResult.rows[0].first_name} ${deleteResult.rows[0].last_name}`);
      console.log(`   Email: ${deleteResult.rows[0].email}`);
      console.log(`   ID: ${deleteResult.rows[0].id}\n`);
    } else {
      console.log('ℹ️  No existing user found\n');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return;
  }

  // Now register fresh
  console.log('📝 Registering fresh user with ID: 8203141234089\n');
  
  const payload = {
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

  console.log('📤 Sending registration request...');
  console.log(`   Email: ${payload.contactInfo.email}\n`);

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status}\n`);

    const data = await response.json();

    if (response.status === 201) {
      console.log('🎉 REGISTRATION SUCCESSFUL!\n');
      console.log('═'.repeat(60));
      console.log('✅ USER ACCOUNT CREATED');
      console.log('═'.repeat(60));
      console.log(`   User ID: ${data.data?.user?.id}`);
      console.log(`   Full Name: ${data.data?.user?.fullName}`);
      console.log(`   Email: ${data.data?.user?.email}`);
      console.log(`   ID Number: ${data.data?.user?.idNumber}`);
      console.log(`   Date of Birth: ${data.data?.user?.dateOfBirth}`);
      console.log(`   Gender: ${data.data?.user?.gender}`);
      console.log(`   Phone: ${data.data?.user?.phoneNumber}`);
      console.log(`   Tax Number: ${data.data?.user?.taxNumber}`);
      console.log(`   Home Affairs Verified: ✅ ${data.data?.user?.homeAffairsVerified}`);
      console.log(`   Account Active: ✅ ${data.data?.user?.isActive}`);
      console.log(`\n🔑 JWT Token Generated: ${data.data?.token ? '✅ Yes' : '❌ No'}`);
      console.log(`   Token Preview: ${data.data?.token?.substring(0, 50)}...`);
    } else {
      console.log('❌ Registration failed\n');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

deleteAndRegister();