// Test registration directly to see exact error
import fetch from 'node-fetch';

const testRegistration = async () => {
  console.log('Testing registration endpoint directly...\n');
  
  const url = 'https://cash-dnr-backend.onrender.com/api/auth/citizen';
  
  const payload = {
    idNumber: '8203141234089',
    contactInfo: {
      email: 'test.registration@example.com',
      phone: '+27 82 555 1234'
    },
    password: 'SecurePass123!',
    homeAddress: {
      streetAddress: '123 Main Street',
      town: 'Sandton',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196'
    }
  };
  
  console.log('Request:', JSON.stringify(payload, null, 2));
  console.log('\n' + '─'.repeat(50));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log(`\nStatus: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('\nError:', error.message);
  }
};

testRegistration();