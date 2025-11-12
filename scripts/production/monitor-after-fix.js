// Monitor production registration endpoint after User model fix
import fetch from 'node-fetch';

const testRegistrationAfterFix = async () => {
  console.log('🔍 Testing registration after User model schema fix...\n');
  
  try {
    const testPayload = {
      idNumber: '8001014321085',
      contactInfo: {
        email: 'schemafix' + Date.now() + '@test.com',
        phone: '+27123456789'
      },
      homeAddress: {
        streetAddress: 'Test Street Fixed',
        town: 'Test Town',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '1234'
      },
      password: 'TestPassword123'
    };

    console.log('📤 Testing production registration with fixed User model...');
    console.log('URL: https://cash-dnr-backend.onrender.com/api/auth/citizen');
    
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 30000
    });

    console.log(`📊 Status: ${response.status}`);
    const data = await response.text();
    console.log(`📄 Response: ${data}`);
    
    if (response.status === 201) {
      console.log('\n🎉 SUCCESS! Registration is working!');
      try {
        const jsonData = JSON.parse(data);
        console.log(`✅ User created: ${jsonData.data?.user?.email}`);
      } catch {}
    } else if (response.status === 400) {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.message?.includes('already exists')) {
          console.log('\n✅ Registration is working! (User already exists)');
        } else {
          console.log('\n⚠️ Validation error:', jsonData.message);
        }
      } catch {}
    } else if (response.status === 500) {
      console.log('\n❌ Still getting 500 error - schema issue may persist');
      console.log('Will need to investigate further...');
    } else {
      console.log('\n⚠️ Unexpected status code');
    }

  } catch (error) {
    console.error('\n🚨 Test failed:', error.message);
  }
};

// Run immediately
testRegistrationAfterFix();

// Also monitor for a few minutes to catch the deployment
let attempt = 1;
const maxAttempts = 10;

const monitor = setInterval(async () => {
  console.log(`\n🔄 Monitor attempt ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
  
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: '8001014321085',
        contactInfo: { email: 'monitor' + Date.now() + '@test.com', phone: '+27123456789' },
        homeAddress: { streetAddress: 'Monitor St', town: 'Monitor', city: 'Monitor', province: 'Monitor', postalCode: '1234' },
        password: 'Monitor123'
      }),
      timeout: 20000
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('🎉 SUCCESS! Registration is working!');
      clearInterval(monitor);
      process.exit(0);
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.message?.includes('already exists')) {
        console.log('✅ Registration is working! (User already exists)');
        clearInterval(monitor);
        process.exit(0);
      }
    }
    
  } catch (error) {
    console.log(`❌ Monitor error: ${error.message}`);
  }
  
  attempt++;
  if (attempt > maxAttempts) {
    console.log('\n⏰ Monitor stopped. Check deployment manually if needed.');
    clearInterval(monitor);
    process.exit(1);
  }
}, 30000); // Check every 30 seconds

console.log('\n🔄 Starting monitoring... Will check for 5 minutes.');