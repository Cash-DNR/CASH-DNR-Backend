// Test registration with new ID number to bypass rate limiting
import fetch from 'node-fetch';

const testNewIdRegistration = async () => {
  console.log('🔍 Testing registration with new ID number: 8203141234089\n');
  
  try {
    const payload = {
      idNumber: '8203141234089',
      contactInfo: {
        email: 'newid' + Date.now() + '@example.com',
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

    console.log('📤 Sending registration request...');
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
      console.log('\n🎉 SUCCESS! Registration completed!');
      console.log('✅ User created successfully');
      console.log(`👤 User: ${data.data?.user?.fullName}`);
      console.log(`🆔 ID: ${data.data?.user?.id}`);
    } else if (response.status === 400) {
      console.log('\n⚠️ Registration failed with validation error');
      console.log('Details:', data.details || data.message);
    } else {
      console.log('\n❌ Registration failed');
      console.log('Error details:', data);
    }

  } catch (error) {
    console.error('\n🚨 Error during registration test:', error.message);
  }
};

testNewIdRegistration();