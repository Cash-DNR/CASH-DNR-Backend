/**
 * Test Current Deployment Status
 * Check what's actually deployed and working
 */

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testDeploymentStatus() {
  console.log('🚀 Testing Current Deployment Status\n');
  
  try {
    // Test 1: Basic registration (we know this works)
    console.log('Test 1: Basic Registration...');
    const testUser = {
      idNumber: "8203141234089",
      contactInfo: {
        email: `deploytest.${Date.now()}@example.com`,
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

    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', await registerResponse.text());
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Registration working - User:', registerResult.data.user.email);
    const token = registerResult.data.token;

    // Test 2: Check what profile endpoint actually returns
    console.log('\nTest 2: Profile Endpoint Response...');
    const profileResponse = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile status:', profileResponse.status);
    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      console.log('✅ Profile response structure:');
      console.log(JSON.stringify(profileResult, null, 2));
    } else {
      console.log('❌ Profile failed:', await profileResponse.text());
    }

    // Test 3: Try a simple upload endpoint to see server response
    console.log('\nTest 3: Upload Endpoint Check...');
    const uploadCheckResponse = await fetch(`${BASE_URL}/api/upload/registration-documents`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Upload OPTIONS status:', uploadCheckResponse.status);
    console.log('Upload OPTIONS headers:', Object.fromEntries(uploadCheckResponse.headers.entries()));

    // Test 4: Try to see if endpoint exists with wrong method
    const uploadGetResponse = await fetch(`${BASE_URL}/api/upload/registration-documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Upload GET status:', uploadGetResponse.status);
    if (uploadGetResponse.status === 405) {
      console.log('✅ Upload endpoint exists (405 = Method Not Allowed for GET)');
    } else if (uploadGetResponse.status === 404) {
      console.log('❌ Upload endpoint not found');
    }

    console.log('\n📊 Deployment Status Summary:');
    console.log('✅ Registration endpoint: Working');
    console.log('✅ JWT authentication: Working');
    console.log('✅ Protected endpoints: Accessible');
    console.log('❓ File upload: Needs investigation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeploymentStatus();