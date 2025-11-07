// Test production registration endpoint
import fetch from 'node-fetch';

const testRegistration = async () => {
  try {
    const payload = {
      idNumber: '8012094321085',
      contactInfo: {
        email: 'test' + Date.now() + '@example.com', // Use unique email
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
    console.log('Response Headers:', response.headers.raw());

    const data = await response.json();
    console.log('\n📄 Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ Registration failed');
      console.error('Error details:', data);
    } else {
      console.log('\n✅ Registration successful!');
    }

  } catch (error) {
    console.error('\n🚨 Error during registration test:', error.message);
    console.error('Stack:', error.stack);
  }
};

testRegistration();
