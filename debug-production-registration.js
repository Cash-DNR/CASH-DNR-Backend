// Debug production registration step-by-step
import fetch from 'node-fetch';

const debugProductionRegistration = async () => {
  console.log('🔍 DEBUGGING Production Registration Step-by-Step\n');
  
  const testId = '8012094321085'; // We know this works with Home Affairs API
  
  console.log('Step 1: Test Home Affairs API directly');
  console.log('=====================================');
  
  try {
    const homeAffairsResponse = await fetch(`https://cash-dnr-api.onrender.com/home-affairs/citizens/${testId}`);
    const homeAffairsData = await homeAffairsResponse.json();
    
    if (homeAffairsResponse.ok) {
      console.log('✅ Home Affairs API working:');
      console.log(`   Name: ${homeAffairsData.citizen?.fullName}`);
      console.log(`   DOB: ${homeAffairsData.citizen?.dateOfBirth}`);
      console.log(`   Gender: ${homeAffairsData.citizen?.gender}`);
    } else {
      console.log('❌ Home Affairs API failed:', homeAffairsData);
      return;
    }
  } catch (error) {
    console.log('❌ Home Affairs API error:', error.message);
    return;
  }

  console.log('\n\nStep 2: Test Production Registration');
  console.log('====================================');
  
  const payload = {
    idNumber: testId,
    contactInfo: {
      email: 'debug-' + Date.now() + '@example.com',
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

  console.log('📤 Testing with payload:');
  console.log('   ID:', payload.idNumber);
  console.log('   Email:', payload.contactInfo.email);
  
  try {
    const regResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`\n📊 Registration Response: ${regResponse.status} ${regResponse.statusText}`);
    
    const regData = await regResponse.json();
    console.log('📄 Response Data:', JSON.stringify(regData, null, 2));

    // Analyze the specific error
    if (regResponse.status === 500) {
      console.log('\n🔍 ANALYSIS: 500 Internal Server Error');
      console.log('This suggests:');
      console.log('1. Home Affairs API call succeeded (we verified this)');
      console.log('2. Error occurred AFTER Home Affairs verification');
      console.log('3. Likely issues: Database connection, User model creation, or data processing');
      
      console.log('\n🎯 LIKELY CAUSES:');
      console.log('• Database connection issue in production');
      console.log('• User model validation failing');
      console.log('• Missing required fields');
      console.log('• Environment variable mismatch');
      console.log('• Date/time formatting issues');
    } else if (regResponse.status === 400) {
      console.log('\n🔍 ANALYSIS: 400 Bad Request');
      console.log('This suggests validation or Home Affairs verification failed');
    } else if (regResponse.status === 201) {
      console.log('\n🎉 SUCCESS: Registration completed!');
    }

  } catch (error) {
    console.log('❌ Registration request failed:', error.message);
  }
};

debugProductionRegistration();