// Delete test user from production database and test registration again
import pkg from 'pg';
const { Client } = pkg;

const deleteAndTest = async () => {
  console.log('🗑️  Deleting Test User from Production Database\n');
  
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  const testEmail = 'fixed-gender-1762771590001@example.com';
  const testIdNumber = '8012094321085';
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // First, check if user exists
    console.log('🔍 Checking for existing test users...');
    const checkQuery = `
      SELECT id, username, email, id_number, first_name, last_name, created_at 
      FROM users 
      WHERE email LIKE 'fixed-gender%' OR email LIKE 'debug-%' OR id_number = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const checkResult = await client.query(checkQuery, [testIdNumber]);
    
    if (checkResult.rows.length > 0) {
      console.log(`Found ${checkResult.rows.length} test user(s):\n`);
      checkResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   ID Number: ${user.id_number}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });

      // Delete test users
      console.log('🗑️  Deleting test users...');
      const deleteQuery = `
        DELETE FROM users 
        WHERE email LIKE 'fixed-gender%' OR email LIKE 'debug-%' OR email LIKE 'working-id-%'
        RETURNING id, email
      `;
      
      const deleteResult = await client.query(deleteQuery);
      console.log(`✅ Deleted ${deleteResult.rowCount} test user(s)\n`);
      
      if (deleteResult.rows.length > 0) {
        deleteResult.rows.forEach(user => {
          console.log(`   ✓ Deleted: ${user.email} (${user.id})`);
        });
      }
    } else {
      console.log('ℹ️  No test users found to delete\n');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }

  // Now test fresh registration
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Fresh Registration');
  console.log('='.repeat(60) + '\n');

  try {
    const { default: fetch } = await import('node-fetch');
    
    const payload = {
      idNumber: '8012094321085',
      contactInfo: {
        email: 'fresh-test-' + Date.now() + '@example.com',
        phone: '+27 68 260 6328'
      },
      homeAddress: {
        streetAddress: '22791 Naartjie Crescent',
        town: 'Soweto',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '1818'
      },
      password: 'Testing400'
    };

    console.log('📤 Testing registration with clean database...');
    console.log(`   Email: ${payload.contactInfo.email}`);
    console.log(`   ID: ${payload.idNumber}\n`);

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
      console.log('🎉 SUCCESS! Fresh registration completed!\n');
      console.log('✅ Citizen Registration Flow Working:');
      console.log(`   ✓ User ID: ${data.data?.user?.id}`);
      console.log(`   ✓ Name: ${data.data?.user?.fullName}`);
      console.log(`   ✓ Email: ${data.data?.user?.email}`);
      console.log(`   ✓ ID Number: ${data.data?.user?.idNumber}`);
      console.log(`   ✓ Gender: ${data.data?.user?.gender}`);
      console.log(`   ✓ Home Affairs Verified: ${data.data?.user?.homeAffairsVerified}`);
      console.log(`   ✓ JWT Token: ${data.data?.token ? 'Generated' : 'Missing'}`);
    } else {
      console.log('❌ Registration failed\n');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

deleteAndTest();