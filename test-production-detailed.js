// Test production registration with detailed logging
import fetch from 'node-fetch';

const testProductionWithLogging = async () => {
  console.log('🔍 Testing PRODUCTION registration with detailed analysis...\n');
  
  try {
    const payload = {
      idNumber: '8012094321085', // Same ID that worked locally
      contactInfo: {
        email: 'prodtest' + Date.now() + '@example.com',
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

    console.log('📤 Sending request to PRODUCTION...');
    console.log('🆔 Using same ID that worked locally:', payload.idNumber);

    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Production Response Status:', response.status);
    
    const data = await response.json();
    console.log('\n📄 Production Response:', JSON.stringify(data, null, 2));

    // Compare with local success
    if (response.status === 201) {
      console.log('\n🎉 PRODUCTION SUCCESS! Registration worked!');
      console.log('✅ Fallback mechanism is working in production too');
    } else if (response.status === 400 && data.details === 'ID verification failed') {
      console.log('\n⚠️ PRODUCTION ISSUE: Home Affairs API failure');
      console.log('❌ Fallback mechanism may not be working in production');
      console.log('🔍 This suggests a configuration difference between local and production');
    } else {
      console.log('\n❓ Unexpected response from production');
    }

  } catch (error) {
    console.error('\n🚨 Error during production test:', error.message);
  }
};

testProductionWithLogging();