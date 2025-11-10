// Register user with ID 8203141234089 showing full request and response
import fetch from 'node-fetch';

const registerWithFullDetails = async () => {
  console.log('═'.repeat(70));
  console.log('🚀 CITIZEN REGISTRATION - FULL REQUEST & RESPONSE');
  console.log('═'.repeat(70));
  
  const requestBody = {
    idNumber: '8203141234089',
    contactInfo: {
      email: 'michelle.white.test@example.com',
      phone: '+27 82 555 1234'
    },
    homeAddress: {
      streetAddress: '456 Oak Avenue',
      town: 'Sandton',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196'
    },
    password: 'SecurePass123!'
  };

  console.log('\n📤 REQUEST DETAILS:');
  console.log('─'.repeat(70));
  console.log('Endpoint: POST https://cash-dnr-backend.onrender.com/api/auth/citizen');
  console.log('Content-Type: application/json');
  console.log('\n📋 REQUEST BODY:');
  console.log(JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n' + '═'.repeat(70));
    console.log('📥 API RESPONSE');
    console.log('═'.repeat(70));
    console.log(`Status Code: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const responseBody = await response.json();
    
    console.log('\n📋 RESPONSE BODY:');
    console.log(JSON.stringify(responseBody, null, 2));

    console.log('\n' + '═'.repeat(70));
    if (response.status === 201) {
      console.log('✅ SUCCESS - User Registered!');
    } else if (response.status === 400) {
      console.log('⚠️  VALIDATION ERROR');
    } else {
      console.log('❌ ERROR');
    }
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ REQUEST FAILED:', error.message);
  }
};

registerWithFullDetails();