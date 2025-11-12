// Test with different ID numbers to avoid rate limiting
import fetch from 'node-fetch';

const testWithDifferentIds = async () => {
  console.log('🔍 Testing registration with different ID numbers to avoid rate limiting...\n');
  
  const testIds = [
    '9001014321085', // Different birth year
    '8501014321085', // Different birth year  
    '9501014321085', // Different birth year
  ];
  
  for (let i = 0; i < testIds.length; i++) {
    const idNumber = testIds[i];
    console.log(`${i + 1}️⃣ Testing with ID: ${idNumber}`);
    
    try {
      const payload = {
        idNumber: idNumber,
        contactInfo: {
          email: `test${Date.now()}${i}@example.com`,
          phone: '+27123456789'
        },
        homeAddress: {
          streetAddress: `Test Street ${i + 1}`,
          town: 'Test Town',
          city: 'Test City',
          province: 'Test Province',
          postalCode: '1234'
        },
        password: 'Test123'
      };

      const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 30000
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.status === 201) {
        const data = await response.json();
        console.log(`   🎉 SUCCESS! User created: ${data.data?.user?.fullName}`);
        console.log(`   📧 Email: ${data.data?.user?.email}`);
        console.log(`   🔑 Token: ${data.data?.token?.substring(0, 50)}...`);
        break; // Success! Stop testing
      } else {
        const errorData = await response.text();
        console.log(`   ❌ Failed: ${errorData.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line between tests
    
    // Wait a bit between requests to avoid overwhelming the API
    if (i < testIds.length - 1) {
      console.log('   ⏳ Waiting 5 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

testWithDifferentIds();