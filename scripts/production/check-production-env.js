// Check production environment configuration
import { config } from 'dotenv';

// Load local environment
config();

const checkEnvironmentConfig = () => {
  console.log('🔍 Local Environment Configuration Check\n');
  console.log('=' .repeat(50));
  
  console.log('\n📊 Production Database Config (from local .env):');
  console.log(`Host: ${process.env.PROD_DB_HOST}`);
  console.log(`Port: ${process.env.PROD_DB_PORT}`);
  console.log(`Database: ${process.env.PROD_DB_NAME}`);
  console.log(`Username: ${process.env.PROD_DB_USER}`);
  console.log(`Password: ${'*'.repeat(process.env.PROD_DB_PASSWORD?.length || 0)}`);
  
  console.log('\n🔧 Environment Variables to Check on Render.com:');
  console.log('Make sure these are set exactly as shown:');
  console.log(`PROD_DB_HOST=${process.env.PROD_DB_HOST}`);
  console.log(`PROD_DB_PORT=${process.env.PROD_DB_PORT}`);
  console.log(`PROD_DB_NAME=${process.env.PROD_DB_NAME}`);
  console.log(`PROD_DB_USER=${process.env.PROD_DB_USER}`);
  console.log(`PROD_DB_PASSWORD=${process.env.PROD_DB_PASSWORD}`);
  console.log(`NODE_ENV=production`);
  
  console.log('\n💡 Steps to verify on Render.com:');
  console.log('1. Go to your service dashboard');
  console.log('2. Click "Environment" tab');
  console.log('3. Check all variables above are present and correct');
  console.log('4. Pay special attention to NODE_ENV=production');
  console.log('5. If any are missing/wrong, update and redeploy');
  
  console.log('\n🔄 Alternative: Use DATABASE_URL');
  console.log('Some services prefer a single DATABASE_URL instead of separate variables:');
  console.log(`DATABASE_URL=${process.env.PROD_DATABASE_URL || 'Not set'}`);
  
  console.log('\n' + '=' .repeat(50));
};

checkEnvironmentConfig();