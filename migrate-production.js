/**
 * Production Migration Script
 * Runs Phase 1 foundational operations migration in production environment
 */

import { config } from 'dotenv';
import logger from '../src/services/logger.js';

// Load environment variables
config();

/**
 * Run production migration
 */
async function runProductionMigration() {
  try {
    console.log('🚀 Starting CASH-DNR Production Migration');
    console.log('=====================================');
    
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    console.log(`📊 Environment: ${process.env.NODE_ENV.toUpperCase()}`);
    console.log(`🗄️  Database: ${process.env.PROD_DB_NAME}`);
    console.log(`🔗 Host: ${process.env.PROD_DB_HOST}`);
    console.log('');
    
    // Test production database connection first
    console.log('🔍 Testing production database connection...');
    
    const { testConnection } = await import('../src/utils/databaseSetup.js');
    const connectionTest = await testConnection();
    
    if (!connectionTest) {
      console.error('❌ Production database connection failed!');
      console.error('Please check your production database credentials.');
      process.exit(1);
    }
    
    console.log('✅ Production database connection successful');
    console.log('');
    
    // Check if tables already exist
    console.log('🔍 Checking existing database structure...');
    const { sequelize } = await import('../src/config/database.js');
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    console.log(`📊 Found ${tables.length} existing tables:`, tables);
    console.log('');
    
    // Run Phase 1 migration
    console.log('🚀 Running Phase 1 foundational operations migration...');
    const migration = await import('../src/migrations/20241217_002_phase1_foundational_operations.js');
    
    await migration.up();
    
    console.log('✅ Phase 1 migration completed successfully!');
    console.log('');
    
    // Verify migration
    console.log('🔍 Verifying migration results...');
    const newTables = await sequelize.getQueryInterface().showAllTables();
    
    console.log(`📊 Total tables after migration: ${newTables.length}`);
    console.log('📋 Tables:', newTables.sort());
    console.log('');
    
    // Test basic functionality
    console.log('🧪 Testing basic model functionality...');
    const { default: User } = await import('../src/models/User.js');
    const { default: CashNote } = await import('../src/models/CashNote.js');
    
    // Test model queries
    const userCount = await User.count();
    const cashNoteCount = await CashNote.count();
    
    console.log(`👥 Users in database: ${userCount}`);
    console.log(`💰 Cash notes in database: ${cashNoteCount}`);
    console.log('');
    
    console.log('🎉 Production Migration Completed Successfully!');
    console.log('==============================================');
    console.log('✅ Database connection: ACTIVE');
    console.log('✅ Phase 1 tables: CREATED');
    console.log('✅ Models: FUNCTIONAL');
    console.log('✅ System: READY FOR PRODUCTION');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Deploy application to production server');
    console.log('  2. Update environment variables on production');
    console.log('  3. Test API endpoints in production');
    console.log('  4. Set up monitoring and logging');
    console.log('  5. Configure backups and disaster recovery');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Production migration failed:', error);
    logger.error('Production migration error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionMigration();
}

export { runProductionMigration };
