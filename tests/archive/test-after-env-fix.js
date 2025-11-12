// Quick production test after environment variable fix
import fetch from 'node-fetch';

const quickProductionTest = async () => {
  console.log('🔍 Quick Production Test After Environment Fix\n');
  
  try {
    const testPayload = {
      idNumber: '8012094321085',
      contactInfo: {
        email: 'envfix' + Date.now() + '@test.com',
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

    console.log('📤 Testing production registration after environment fix...');
    
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 20000
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('🎉 SUCCESS! Production is working!');
      const data = await response.json();
      console.log(`✅ User created: ${data.data?.user?.fullName}`);
    } else if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.message?.includes('already exists')) {
        console.log('✅ Production is working! (User already exists)');
      } else {
        console.log('⚠️ Validation error:', errorData.message);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Still failing:', errorData);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
};

quickProductionTest();