// Monitor production until it's fixed
import fetch from 'node-fetch';

let attempts = 0;
const checkProduction = async () => {
  attempts++;
  console.log(`\n🔍 Check #${attempts} - ${new Date().toLocaleTimeString()}`);
  
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: '8012094321085',
        contactInfo: { email: 'test' + Date.now() + '@example.com', phone: '+27123456789' },
        homeAddress: { streetAddress: 'Test', town: 'Test', city: 'Test', province: 'Test', postalCode: '1234' },
        password: 'Test123'
      }),
      timeout: 15000
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('🎉 SUCCESS! Production registration is working!');
      return true;
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.message?.includes('already exists')) {
        console.log('✅ Production is working! (User already exists)');
        return true;
      }
    }
    
    const data = await response.text();
    console.log(`❌ Still failing: ${data.substring(0, 100)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  return false;
};

// Check immediately
const success = await checkProduction();
if (!success) {
  console.log('\n⏳ Will check again in 60 seconds...');
  console.log('💡 Make sure to set the environment variables on Render.com!');
}