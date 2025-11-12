/* eslint-disable linebreak-style */
/**
 * Test all models to ensure they load without errors
 */

import dotenv from 'dotenv';
import { sequelize } from './src/config/database.js';

// Load environment variables
dotenv.config();

async function testAllModels() {
  try {
    console.log('🔄 Testing all models...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Import all models
    const { default: User } = await import('./src/models/User.js');
    const { default: File } = await import('./src/models/File.js');
    const { default: Business } = await import('./src/models/Business.js');
    
    console.log('✅ All models imported successfully');
    console.log('Available models:');
    console.log('- User model:', !!User);
    console.log('- File model:', !!File);
    console.log('- Business model:', !!Business);
    
    console.log('\n🎉 All models are working correctly!');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testAllModels();