// Quick test of Home Affairs API
import fetch from 'node-fetch';

const testHomeAffairsAPI = async () => {
  console.log('Testing Home Affairs API...\n');
  
  const testIDs = ['8203141234089', '8012094321085'];
  
  for (const idNumber of testIDs) {
    console.log(`\nTesting ID: ${idNumber}`);
    console.log('─'.repeat(50));
    
    try {
      const url = `https://cash-dnr-api.onrender.com/home-affairs/citizens/${idNumber}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      console.log(`Response: ${text}\n`);
      
      if (response.ok) {
        const data = JSON.parse(text);
        if (data.citizen) {
          console.log(`✅ Valid - ${data.citizen.fullName}`);
        }
      } else {
        console.log(`❌ Failed`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
};

testHomeAffairsAPI();