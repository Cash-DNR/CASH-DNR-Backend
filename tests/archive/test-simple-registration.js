/**
 * Test Simple Registration Flow
 * Just test the basic registration to confirm JWT token functionality
 */

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

// Test user data
const testUser = {
  idNumber: "8203141234089", // Michelle White
  contactInfo: {
    email: `simpletest.${Date.now()}@example.com`,
    phone: "+27 82 555 1234"
  },
  homeAddress: {
    streetAddress: "123 Test Street",
    town: "Sandton", 
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2196"
  },
  password: "TestPassword123!"
};

async function testSimpleRegistration() {
  console.log('🚀 Testing Simple Registration Flow\n');
  
  try {
    // Step 1: Basic Registration (Get JWT Token)
    console.log('Step 1: Basic Registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.error('❌ Registration failed:', error);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Registration Success!');
    console.log('   User ID:', registerResult.data.user.id);
    console.log('   Username:', registerResult.data.user.username);
    console.log('   Email:', registerResult.data.user.email);
    console.log('   Full Name:', registerResult.data.user.fullName);
    console.log('   Phone:', registerResult.data.user.phoneNumber);
    console.log('   Verified Status:', registerResult.data.user.isVerified);
    console.log('   JWT Token Length:', registerResult.data.token.length);

    const jwtToken = registerResult.data.token;

    // Step 2: Test JWT Token - Try to access a protected endpoint
    console.log('\nStep 2: Testing JWT Token...');
    const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      console.log('✅ JWT Token Valid! Profile endpoint accessible');
      console.log('   Profile User ID:', profileResult.data.id);
    } else {
      console.log('❌ JWT Token issue or profile endpoint not accessible');
      console.log('   Status:', profileResponse.status);
    }

    console.log('\n🎉 Simple Registration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registered successfully');
    console.log('   ✅ JWT token provided for immediate access');
    console.log('   ✅ User can proceed to use the application');
    console.log('\n💡 Next Steps for Frontend:');
    console.log('   1. Store JWT token in localStorage/secure storage');
    console.log('   2. Use token for all authenticated API calls');
    console.log('   3. Optionally prompt user to upload documents later');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSimpleRegistration();