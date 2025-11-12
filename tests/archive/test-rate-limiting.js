// Test Home Affairs API rate limiting behavior
import fetch from 'node-fetch';

const testRateLimiting = async () => {
  console.log('🔍 Testing Home Affairs API Rate Limiting Behavior\n');
  
  const testIds = [
    '8203141234089', // Previously working ID
    '8012094321085', // Another test ID
    '9001011234567'  // Different test ID
  ];

  for (let i = 0; i < testIds.length; i++) {
    const idNumber = testIds[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Test ${i + 1}/3: Testing ID ${idNumber}`);
    console.log('='.repeat(50));

    try {
      const url = `https://cash-dnr-api.onrender.com/home-affairs/citizens/${idNumber}`;
      console.log(`🌐 URL: ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'CASH-DNR-Backend/1.0'
        }
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Response Time: ${duration}ms`);
      console.log(`📊 Status Code: ${response.status}`);
      console.log(`📋 Status Text: ${response.statusText}`);

      // Check response headers for rate limiting info
      const rateLimitHeaders = {};
      for (const [key, value] of response.headers) {
        if (key.toLowerCase().includes('rate') || 
            key.toLowerCase().includes('limit') ||
            key.toLowerCase().includes('retry') ||
            key.toLowerCase().includes('remaining')) {
          rateLimitHeaders[key] = value;
        }
      }

      if (Object.keys(rateLimitHeaders).length > 0) {
        console.log('🚦 Rate Limit Headers:');
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      } else {
        console.log('🚦 No rate limit headers found');
      }

      const responseText = await response.text();
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ SUCCESS - API Response:');
          if (data.citizen) {
            console.log(`   Name: ${data.citizen.fullName || 'Not provided'}`);
            console.log(`   DOB: ${data.citizen.dateOfBirth || 'Not provided'}`);
            console.log(`   Gender: ${data.citizen.gender || 'Not provided'}`);
          } else {
            console.log('   Raw data:', JSON.stringify(data, null, 2));
          }
        } catch (e) {
          console.log('✅ SUCCESS - Non-JSON Response:');
          console.log(`   Response: ${responseText.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ ERROR - Status ${response.status}:`);
        try {
          const errorData = JSON.parse(responseText);
          console.log(`   Error: ${errorData.error || errorData.message || 'Unknown error'}`);
          console.log(`   Details: ${JSON.stringify(errorData, null, 2)}`);
        } catch (e) {
          console.log(`   Raw error: ${responseText.substring(0, 200)}...`);
        }
      }

    } catch (error) {
      console.log(`🚨 REQUEST FAILED: ${error.message}`);
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
    }

    // Wait between requests to avoid hitting rate limits too hard
    if (i < testIds.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Rate Limiting Test Complete');
  console.log('='.repeat(50));
};

testRateLimiting();