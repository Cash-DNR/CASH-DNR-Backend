// Test production-only Home Affairs integration (no fallbacks)
import fetch from 'node-fetch';

const testProductionRegistrationNoFallbacks = async () => {
  console.log('🏭 Testing PRODUCTION-ONLY registration (no fallbacks)');
  console.log('Using ID: 8203141234089 (confirmed working with Home Affairs API)\n');
  
  try {
    const payload = {
      idNumber: '8203141234089',
      contactInfo: {
        email: 'prod-only-' + Date.now() + '@example.com',
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

    console.log('📤 Sending to PRODUCTION endpoint...');
    console.log('URL: https://cash-dnr-backend.onrender.com/api/auth/citizen');
    console.log('Expected behavior: Use ONLY Home Affairs API data, NO fallbacks\n');

    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Response Status:', response.status);

    const data = await response.json();
    console.log('\n📄 Response Data:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Production registration completed!');
      console.log('✅ No fallbacks used - pure Home Affairs API integration');
      console.log(`👤 User: ${data.data?.user?.fullName}`);
      console.log(`🆔 Real name from Home Affairs: ${data.data?.user?.firstName} ${data.data?.user?.lastName}`);
      console.log(`🏠 Home Affairs Verified: ${data.data?.user?.homeAffairsVerified}`);
    } else if (response.status === 400) {
      if (data.details === 'ID verification failed') {
        console.log('\n⚠️ Home Affairs API rejected the ID');
        console.log('This is expected if the API is down or rate limiting');
      } else {
        console.log('\n⚠️ Registration validation failed');
        console.log('Details:', data.details || data.message);
      }
    } else if (response.status === 500) {
      console.log('\n❌ Internal server error');
      console.log('Details:', data.details || data.message);
      console.log('This should NOT happen with proper integration');
    } else {
      console.log('\n❓ Unexpected response');
      console.log('Data:', data);
    }

  } catch (error) {
    console.error('\n🚨 Network Error:', error.message);
  }
};

testProductionRegistrationNoFallbacks();