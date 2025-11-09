// Test local registration endpoint
import fetch from 'node-fetch';

const testLocalRegistration = async () => {
  console.log('🏠 Testing LOCAL registration endpoint...\n');
  
  const baseUrl = 'http://localhost:3000'; // Local server
  
  try {
    const payload = {
      idNumber: '8012094321085',
      contactInfo: {
        email: 'localtest' + Date.now() + '@example.com',
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

    console.log('📤 Sending registration request to local server...');
    console.log('URL:', `${baseUrl}/api/auth/citizen`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${baseUrl}/api/auth/citizen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Response Status:', response.status);
    
    const data = await response.text();
    console.log('\n📄 Response Data:');
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch {
      console.log(data);
    }

    if (!response.ok) {
      console.error('\n❌ Registration failed');
    } else {
      console.log('\n✅ Registration successful!');
    }

  } catch (error) {
    console.error('\n🚨 Error during local registration test:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your local server is running:');
      console.log('   Run: node server.js');
      console.log('   Or: npm start');
    }
  }
};

testLocalRegistration();