// Test production registration with different ID number
const fetch = require('node-fetch');

const testWithNewId = async () => {
  console.log('🔍 Testing production registration with new ID number...\n');
  
  try {
    const payload = {
      idNumber: '8203141234089', // New ID number to avoid rate limiting
      contactInfo: {
        email: 'newid' + Date.now() + '@test.com',
        phone: '+27123456789'
      },
      homeAddress: {
        streetAddress: 'Test Street',
        town: 'Test Town',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '1234'
      },
      password: 'TestPassword123'
    };

    console.log('📤 Sending registration request...');
    console.log('ID Number:', payload.idNumber);
    console.log('Email:', payload.contactInfo.email);

    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      timeout: 30000 // Longer timeout for Home Affairs API
    });

    console.log('\n📊 Response Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('\n🎉 SUCCESS! Registration completed!');
      console.log('✅ User created:', data.data?.user?.fullName);
      console.log('✅ User ID:', data.data?.user?.id);
      console.log('✅ Token generated:', data.data?.token ? 'Yes' : 'No');
      console.log('✅ Home Affairs verified:', data.data?.user?.homeAffairsVerified);
      
      return true;
    } else {
      const errorData = await response.json();
      console.log('\n❌ Registration failed');
      console.log('Status:', response.status);
      console.log('Error:', errorData);
      
      if (errorData.details?.includes('Too Many Requests')) {
        console.log('\n💡 Still rate limited - Home Affairs API needs time to reset');
      } else if (errorData.details?.includes('not found')) {
        console.log('\n💡 ID not found in Home Affairs system (this is normal for test IDs)');
      }
      
      return false;
    }

  } catch (error) {
    console.error('\n🚨 Request error:', error.message);
    return false;
  }
};

testWithNewId();