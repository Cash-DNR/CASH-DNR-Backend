import fetch from 'node-fetch';

console.log('🔍 Testing with another ID: 9001011234567...');

const testRegistration = async () => {
  const testData = {
    idNumber: '9001011234567',
    contactInfo: {
      email: 'test' + Date.now() + '@example.com', 
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

  console.log('📤 Sending request...');
  console.log('Payload:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('\n📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Registration completed!');
    } else {
      console.log('\n⚠️ Registration failed with status:', response.status);
    }

  } catch (error) {
    console.error('\n🚨 Error:', error.message);
  }
};

testRegistration();