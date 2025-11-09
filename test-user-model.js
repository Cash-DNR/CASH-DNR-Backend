/* eslint-disable linebreak-style */
/**
 * Test script to verify User model works with production database
 * This checks if we can create a user without any schema errors
 */

import dotenv from 'dotenv';
import { sequelize } from './src/config/database.js';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

async function testUserModel() {
  try {
    console.log('🔄 Testing User model with production database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test User model definition
    const testUserData = {
      username: `test_user_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password_hash: 'test_password_hash',
      first_name: 'Test',
      last_name: 'User',
      phone_number: '+27123456789',
      homeAddress: {
        streetAddress: '123 Test Street',
        town: 'Test Town',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8000'
      }
    };
    
    console.log('🔄 Creating test user...');
    const testUser = await User.create(testUserData);
    console.log('✅ User created successfully:', testUser.username);
    
    console.log('🔄 Testing homeAddress field...');
    console.log('Home Address:', testUser.homeAddress);
    
    // Clean up - delete test user
    console.log('🔄 Cleaning up test user...');
    await testUser.destroy();
    console.log('✅ Test user deleted successfully');
    
    console.log('\n🎉 All User model tests passed!');
    console.log('The registration endpoint should now work without schema errors.');
    
  } catch (error) {
    console.error('❌ User model test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testUserModel();