// Test local registration endpoint
import fetch from 'node-fetch';

const testLocalRegistration = async () => {
  try {
    const payload = {
      idNumber: '8012094321085',
      contactInfo: {
        email: 'testlocal' + Date.now() + '@example.com',
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

    console.log('📤 Testing LOCAL registration...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('http://localhost:3000/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Response Status:', response.status);

    const data = await response.json();
    console.log('\n📄 Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ Registration failed');
      console.error('Error details:', data);
    } else {
      console.log('\n✅ LOCAL Registration successful!');
      console.log('Token:', data.data?.token?.substring(0, 50) + '...');
    }

  } catch (error) {
    console.error('\n🚨 Error during local registration test:', error.message);
    console.error('Stack:', error.stack);
  }
};

testLocalRegistration();
