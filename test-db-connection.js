// Test database connection
import { testConnection } from './src/config/database.js';

console.log('🔍 Testing database connection...');
console.log('Environment:', process.env.NODE_ENV);

// Test production connection
process.env.NODE_ENV = 'production';
console.log('\n📊 Testing PRODUCTION database connection...');
await testConnection();

// Test development connection
process.env.NODE_ENV = 'development';
console.log('\n🛠️ Testing DEVELOPMENT database connection...');
await testConnection();