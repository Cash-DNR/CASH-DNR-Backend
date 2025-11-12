// Monitor production until it works
import fetch from 'node-fetch';

const testProduction = async () => {
  const payload = {
    idNumber: '8012094321085',
    contactInfo: {
      email: 'monitor' + Date.now() + '@example.com',
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

  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return { status: response.status, success: data.success, data };
  } catch (error) {
    return { status: 0, success: false, error: error.message };
  }
};

let attempt = 1;
const maxAttempts = 10;

const monitor = setInterval(async () => {
  console.log(`\n🔍 Attempt ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
  
  const result = await testProduction();
  
  if (result.status === 201 && result.success) {
    console.log('✅ SUCCESS! Production is working!');
    console.log('User created:', result.data.data?.user?.email);
    clearInterval(monitor);
    process.exit(0);
  } else if (result.status === 400 && result.data?.message?.includes('already')) {
    console.log('⚠️  User already exists (previous test succeeded)');
    console.log('✅ Production is working!');
    clearInterval(monitor);
    process.exit(0);
  } else {
    console.log(`❌ Status: ${result.status} - Still getting errors`);
    console.log(`Details: ${result.data?.message || result.error}`);
  }
  
  attempt++;
  if (attempt > maxAttempts) {
    console.log('\n⏰ Max attempts reached. Please manually deploy on Render dashboard.');
    console.log('URL: https://dashboard.render.com/');
    clearInterval(monitor);
    process.exit(1);
  }
}, 30000); // Check every 30 seconds

console.log('🔄 Monitoring production deployment...');
console.log('⏱️  Will check every 30 seconds for up to 5 minutes');
console.log('📍 URL: https://cash-dnr-backend.onrender.com/api/auth/citizen\n');
