// Monitor production endpoint recovery
import fetch from 'node-fetch';

const monitorProduction = async () => {
  console.log('🔍 Monitoring production endpoint recovery...\n');
  console.log('💡 This will check every 30 seconds until the endpoint is working\n');
  console.log('Press Ctrl+C to stop monitoring\n');
  
  let attempts = 0;
  const maxAttempts = 20; // Monitor for 10 minutes max
  
  const checkEndpoint = async () => {
    attempts++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      console.log(`[${timestamp}] Attempt ${attempts}: Testing production endpoint...`);
      
      // Test basic API endpoint first
      const basicResponse = await fetch('https://cash-dnr-backend.onrender.com/', {
        method: 'GET',
        timeout: 10000
      });
      
      console.log(`   Basic API Status: ${basicResponse.status}`);
      
      if (basicResponse.ok) {
        // Test registration endpoint with minimal payload
        const testPayload = {
          idNumber: '8012094321085',
          contactInfo: {
            email: 'monitor' + Date.now() + '@example.com',
            phone: '+27123456789'
          },
          homeAddress: {
            streetAddress: 'Test Street',
            town: 'Test Town',
            city: 'Test City',
            province: 'Test Province',
            postalCode: '1234'
          },
          password: 'TestPassword123'
        };

        const registerResponse = await fetch('https://cash-dnr-backend.onrender.com/api/auth/citizen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload),
          timeout: 15000
        });

        console.log(`   Registration Status: ${registerResponse.status}`);
        
        if (registerResponse.status === 201) {
          const data = await registerResponse.json();
          console.log('\n🎉 SUCCESS! Production endpoint is working!');
          console.log('✅ Registration completed successfully');
          console.log(`👤 User created: ${data.data?.user?.fullName || 'Unknown'}`);
          console.log('\n🚀 Your production server is ready for use!');
          return true; // Stop monitoring
        } else if (registerResponse.status === 400) {
          const errorData = await registerResponse.json();
          if (errorData.message?.includes('already exists')) {
            console.log('\n✅ Production endpoint is working! (User already exists)');
            console.log('🚀 Your production server is ready for use!');
            return true; // Stop monitoring
          }
        } else {
          const errorText = await registerResponse.text();
          console.log(`   Error: ${errorText.substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n⏰ Monitoring timeout reached. Production server may need manual intervention.');
      console.log('💡 Try restarting the service on Render.com dashboard');
      return true; // Stop monitoring
    }
    
    console.log('   ⏳ Waiting 30 seconds before next check...\n');
    return false; // Continue monitoring
  };
  
  // Initial check
  const shouldStop = await checkEndpoint();
  if (shouldStop) return;
  
  // Set up interval
  const interval = setInterval(async () => {
    const shouldStop = await checkEndpoint();
    if (shouldStop) {
      clearInterval(interval);
    }
  }, 30000); // Check every 30 seconds
};

monitorProduction();