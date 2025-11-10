// Test Home Affairs API directly
import fetch from 'node-fetch';

const testHomeAffairsAPI = async () => {
  console.log('🔍 Testing Home Affairs API directly...\n');
  
  const apiUrl = 'https://cash-dnr-api.onrender.com';
  const testIds = [
    '8001011234567', // Original ID that was rate limited
    '8203141234089', // Second ID we tried
    '9001011234567', // Third ID we tried
    '8012094321085'  // ID that worked locally
  ];

  for (const idNumber of testIds) {
    console.log(`\n📋 Testing ID: ${idNumber}`);
    
    try {
      const response = await fetch(`${apiUrl}/verify-id/${idNumber}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }

    } catch (error) {
      console.log(`🚨 API Error: ${error.message}`);
    }
    
    // Wait between requests to avoid additional rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

testHomeAffairsAPI();