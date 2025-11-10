// Test production registration with ID that works with Home Affairs API
import fetch from 'node-fetch';

const testProductionRegistration = async () => {
  console.log('🔍 Testing PRODUCTION registration with working ID: 8203141234089');
  console.log('(We confirmed this ID works with Home Affairs API)\n');
  
  try {
    const payload = {
      idNumber: '8203141234089',
      contactInfo: {
        email: 'working-id-' + Date.now() + '@example.com',
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

    console.log('📤 Sending registration request to PRODUCTION...');
    console.log('URL: https://cash-dnr-backend.onrender.com/api/auth/citizen');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Response Status:', response.status);

    const data = await response.json();
    console.log('\n📄 Response Data:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Production registration completed!');
      console.log('✅ User created successfully in production');
      console.log(`👤 User: ${data.data?.user?.fullName}`);
      console.log(`🆔 ID: ${data.data?.user?.id}`);
      console.log(`📧 Email: ${data.data?.user?.email}`);
      console.log(`🏠 Home Affairs Verified: ${data.data?.user?.homeAffairsVerified}`);
    } else if (response.status === 400) {
      console.log('\n⚠️ Registration failed with validation error');
      console.log('Details:', data.details || data.message);
      console.log('\n🔍 This suggests an issue in our registration endpoint processing');
    } else if (response.status === 500) {
      console.log('\n❌ Internal server error in production');
      console.log('Details:', data.details || data.message);
      console.log('\n🔍 This suggests a server-side issue in production environment');
    } else {
      console.log('\n❓ Unexpected response status');
      console.log('Details:', data);
    }

  } catch (error) {
    console.error('\n🚨 Error during production registration test:', error.message);
  }
};

testProductionRegistration();