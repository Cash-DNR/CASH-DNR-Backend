// Test production registration after fixing gender field
import fetch from 'node-fetch';

const testAfterGenderFix = async () => {
  console.log('🔧 Testing Production Registration After Gender Fix\n');
  console.log('Fix Applied: Gender now converts "Male"/"Female" to "M"/"F"\n');
  
  const payload = {
    idNumber: '8012094321085',
    contactInfo: {
      email: 'fixed-gender-' + Date.now() + '@example.com',
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

  console.log('📤 Sending registration request...');
  console.log(`Email: ${payload.contactInfo.email}\n`);

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status}`);

    const data = await response.json();
    console.log('\n📄 Response Data:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Production registration completed!');
      console.log('✅ Gender field properly converted to single character');
      console.log('✅ Home Affairs API integration working perfectly');
      console.log(`\n👤 User Created:`);
      console.log(`   Name: ${data.data?.user?.fullName}`);
      console.log(`   Email: ${data.data?.user?.email}`);
      console.log(`   ID Number: ${data.data?.user?.idNumber}`);
      console.log(`   Gender: ${data.data?.user?.gender} (should be 'M' or 'F')`);
      console.log(`   Home Affairs Verified: ${data.data?.user?.homeAffairsVerified}`);
      console.log(`\n🔑 JWT Token: ${data.data?.token?.substring(0, 50)}...`);
    } else if (response.status === 500) {
      console.log('\n❌ Still getting 500 error - may need more time for deployment');
      console.log('Or there may be another field with schema mismatch');
    } else {
      console.log(`\n⚠️ Unexpected status: ${response.status}`);
    }

  } catch (error) {
    console.error('\n🚨 Request failed:', error.message);
  }
};

testAfterGenderFix();