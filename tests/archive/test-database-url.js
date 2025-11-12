// Test DATABASE_URL configuration locally
import { config } from 'dotenv';

// Load environment variables
config();

// Test DATABASE_URL approach
const testDatabaseURL = async () => {
  console.log('🔍 Testing DATABASE_URL Configuration\n');
  
  // Set environment to production mode
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
  
  console.log('📊 Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  
  try {
    // Import database after setting environment
    const { testConnection } = await import('./src/config/database.js');
    
    console.log('\n🔌 Testing database connection with DATABASE_URL...');
    await testConnection();
    
    console.log('\n✅ DATABASE_URL configuration works!');
    console.log('\n📝 Environment variables needed on Render.com:');
    console.log(`DATABASE_URL=${process.env.DATABASE_URL}`);
    console.log('NODE_ENV=production');
    console.log('JWT_SECRET=h,F<m$f@4=g^ZcD3>-8;a');
    console.log('PORT=3000');
    
  } catch (error) {
    console.error('\n❌ DATABASE_URL configuration failed:', error.message);
  }
};

testDatabaseURL();