// Test production database connection and User model
import fetch from 'node-fetch';

const testProductionDatabase = async () => {
  console.log('🔍 Testing Production Database Connection\n');
  
  // Test a simple endpoint that uses the database but doesn't require complex validation
  try {
    console.log('Testing basic database connection...');
    const response = await fetch('https://cash-dnr-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });

    console.log(`📊 Login endpoint status: ${response.status}`);
    const data = await response.json();
    console.log('📄 Response:', JSON.stringify(data, null, 2));

    if (response.status === 401 || response.status === 400) {
      console.log('✅ Database connection appears to be working (got validation response)');
    } else if (response.status === 500) {
      console.log('❌ Database connection might be failing (500 error)');
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('💡 NEXT DEBUGGING STEPS:');
  console.log('1. Check if database tables exist in production');
  console.log('2. Verify User model schema matches production database');
  console.log('3. Check environment variables in production');
  console.log('4. Look for data validation errors in User creation');
  console.log('='.repeat(50));
};

testProductionDatabase();