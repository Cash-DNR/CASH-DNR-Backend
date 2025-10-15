/**
 * Production Migration with Enhanced Error Handling
 * Handles cloud database connectivity and migration issues
 */

import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

// Load environment variables
config();

// Set environment to production
process.env.NODE_ENV = 'production';

console.log('🚀 CASH-DNR Production Migration Starting...');
console.log('===========================================');

/**
 * Test production database connectivity with multiple approaches
 */
async function testProductionConnectivity() {
  console.log('🔍 Testing production database connectivity...');
  
  // Try DATABASE_URL approach first (recommended for cloud databases)
  if (process.env.PROD_DATABASE_URL) {
    console.log('🔗 Attempting connection via DATABASE_URL...');
    try {
      const sequelize = new Sequelize(process.env.PROD_DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false
      });
      
      await sequelize.authenticate();
      await sequelize.close();
      console.log('✅ DATABASE_URL connection successful!');
      return { success: true, method: 'DATABASE_URL' };
      
    } catch (error) {
      console.log(`❌ DATABASE_URL failed: ${error.message}`);
    }
  }
  
  // Try individual parameters with SSL
  console.log('🔗 Attempting connection via individual parameters with SSL...');
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_NAME,
      username: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    });
    
    await sequelize.authenticate();
    await sequelize.close();
    console.log('✅ Individual parameters with SSL successful!');
    return { success: true, method: 'SSL_PARAMS' };
    
  } catch (error) {
    console.log(`❌ SSL connection failed: ${error.message}`);
  }
  
  // Try without SSL (fallback)
  console.log('🔗 Attempting connection without SSL (fallback)...');
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_NAME,
      username: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      logging: false
    });
    
    await sequelize.authenticate();
    await sequelize.close();
    console.log('✅ Non-SSL connection successful!');
    return { success: true, method: 'NO_SSL' };
    
  } catch (error) {
    console.log(`❌ Non-SSL connection failed: ${error.message}`);
  }
  
  return { success: false };
}

/**
 * Main migration execution
 */
async function runProductionMigration() {
  try {
    console.log('📊 Environment: PRODUCTION');
    console.log('🗄️  Target Database: cash_dnr (Cloud PostgreSQL)');
    console.log('');
    
    // Test connectivity first
    const connectivityTest = await testProductionConnectivity();
    
    if (!connectivityTest.success) {
      console.log('');
      console.log('❌ Cannot connect to production database!');
      console.log('');
      console.log('🛠️  Troubleshooting Steps:');
      console.log('1. Check if the cloud database service is running');
      console.log('2. Verify the database hostname is correct (may have changed)');
      console.log('3. Confirm network connectivity to the database');
      console.log('4. Check database credentials and SSL requirements');
      console.log('');
      console.log('💡 Common Solutions:');
      console.log('- Update PROD_DB_HOST if the hostname changed');
      console.log('- Check with your database provider for status');
      console.log('- Verify SSL/TLS requirements');
      
      process.exit(1);
    }
    
    console.log(`🎯 Using connection method: ${connectivityTest.method}`);
    console.log('');
    console.log('🚀 Executing Phase 1 migration...');
    
    // Import and run migration
    const { up } = await import('./src/migrations/20241217_002_phase1_foundational_operations.js');
    await up();
    
    console.log('');
    console.log('🎉 Production Migration Completed Successfully!');
    console.log('✅ Phase 1 foundational operations deployed to production');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Test API endpoints in production environment');
    console.log('2. Verify user registration and authentication');
    console.log('3. Test cash note operations');
    console.log('4. Monitor logs for any issues');
    
  } catch (error) {
    console.log('');
    console.error('❌ Production migration failed:', error.message);
    console.log('');
    console.log('🔧 Debug Information:');
    console.log(`Error Type: ${error.name}`);
    console.log(`Error Details: ${error.message}`);
    if (error.stack) {
      console.log(`Stack Trace: ${error.stack.split('\n')[0]}`);
    }
    
    process.exit(1);
  }
}

// Run the migration
runProductionMigration();
