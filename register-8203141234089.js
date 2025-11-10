// Register ID 8203141234089 (Michelle White)
import fetch from 'node-fetch';

const registerUser = async () => {
  console.log('📝 Registering User with ID: 8203141234089\n');
  
  const payload = {
    idNumber: '8203141234089',
    contactInfo: {
      email: 'user8203141234089@example.com',
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

  console.log('📤 Sending registration request...');
  console.log('Details:');
  console.log(`   ID Number: ${payload.idNumber}`);
  console.log(`   Email: ${payload.contactInfo.email}`);
  console.log(`   Phone: ${payload.contactInfo.phone}`);
  console.log(`   Address: ${payload.homeAddress.streetAddress}, ${payload.homeAddress.city}\n`);

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response Status: ${response.status}\n`);

    const data = await response.json();

    if (response.status === 201) {
      console.log('🎉 REGISTRATION SUCCESSFUL!\n');
      console.log('✅ User Details:');
      console.log(`   User ID: ${data.data?.user?.id}`);
      console.log(`   Full Name: ${data.data?.user?.fullName}`);
      console.log(`   First Name: ${data.data?.user?.firstName}`);
      console.log(`   Last Name: ${data.data?.user?.lastName}`);
      console.log(`   Email: ${data.data?.user?.email}`);
      console.log(`   ID Number: ${data.data?.user?.idNumber}`);
      console.log(`   Date of Birth: ${data.data?.user?.dateOfBirth}`);
      console.log(`   Gender: ${data.data?.user?.gender}`);
      console.log(`   Phone: ${data.data?.user?.phoneNumber}`);
      console.log(`   Tax Number: ${data.data?.user?.taxNumber}`);
      console.log(`   Home Affairs Verified: ${data.data?.user?.homeAffairsVerified}`);
      console.log(`   Account Active: ${data.data?.user?.isActive}`);
      console.log(`   Email Verified: ${data.data?.user?.isVerified}`);
      console.log(`\n🔑 Authentication:`);
      console.log(`   JWT Token: ${data.data?.token?.substring(0, 50)}...`);
      console.log(`   Registration Complete: ${data.data?.registrationComplete}`);
    } else if (response.status === 400) {
      console.log('⚠️  Registration Failed - Validation Error\n');
      console.log('Error Details:', JSON.stringify(data, null, 2));
      
      if (data.details?.includes('already registered')) {
        console.log('\n💡 This ID number or email is already registered in the system');
      }
    } else {
      console.log(`❌ Registration Failed - Status ${response.status}\n`);
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

registerUser();