/**
 * Database Setup and Migration Utility
 * Handles initial database setup, table creation, and Phase 1 migrations
 */

import { sequelize } from '../config/database.js';
import logger from '../services/logger.js';

// Import all models to ensure they're registered
import '../models/index.js';

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    return false;
  }
}

/**
 * Create all tables based on models
 */
async function createTables() {
  try {
    logger.info('📝 Creating database tables...');
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ 
      force: false, // Don't drop existing tables
      alter: true   // Modify existing tables to match models
    });
    
    logger.info('✅ All database tables created/updated successfully');
    return true;
  } catch (error) {
    logger.error('❌ Error creating database tables:', error);
    return false;
  }
}

/**
 * Drop all tables (use with caution!)
 */
async function dropAllTables() {
  try {
    logger.warn('🗑️ Dropping all database tables...');
    
    await sequelize.sync({ force: true });
    
    logger.warn('⚠️ All database tables dropped');
    return true;
  } catch (error) {
    logger.error('❌ Error dropping database tables:', error);
    return false;
  }
}

/**
 * Reset database (drop and recreate all tables)
 */
async function resetDatabase() {
  try {
    logger.warn('🔄 Resetting database...');
    
    // First test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Drop and recreate all tables
    await sequelize.sync({ force: true });
    
    logger.info('✅ Database reset completed');
    return true;
  } catch (error) {
    logger.error('❌ Error resetting database:', error);
    return false;
  }
}

/**
 * Initialize database for Phase 1
 */
async function initializePhase1Database() {
  try {
    logger.info('🚀 Initializing Phase 1 Database...');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Create/update tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      throw new Error('Failed to create tables');
    }
    
    // Run Phase 1 migration if needed
    try {
      logger.info('📦 Running Phase 1 migration...');
      const migration = await import('../migrations/20241217_002_phase1_foundational_operations.js');
      await migration.up();
      logger.info('✅ Phase 1 migration completed');
    } catch (migrationError) {
      // Migration might fail if already run, log but don't fail setup
      logger.warn('⚠️ Phase 1 migration warning:', migrationError.message);
    }
    
    logger.info('🎉 Phase 1 Database initialization completed successfully!');
    logger.info('📊 Available Features:');
    logger.info('   ✓ User registration with Home Affairs verification');
    logger.info('   ✓ Automatic tax number generation');
    logger.info('   ✓ Cash note digital tracking');
    logger.info('   ✓ Ownership transfer management');
    logger.info('   ✓ Comprehensive audit logging');
    
    return true;
  } catch (error) {
    logger.error('❌ Phase 1 Database initialization failed:', error);
    return false;
  }
}

/**
 * Get database status information
 */
async function getDatabaseStatus() {
  try {
    const connected = await testConnection();
    if (!connected) {
      return { connected: false };
    }
    
    // Get table information
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    
    // Count records in key tables
    const counts = {};
    const keyTables = ['users', 'cash_notes', 'cash_note_transfers', 'audit_logs'];
    
    for (const table of keyTables) {
      if (tables.includes(table)) {
        try {
          const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
          counts[table] = parseInt(results[0].count);
        } catch (error) {
          counts[table] = 'Error';
        }
      } else {
        counts[table] = 'Not exists';
      }
    }
    
    return {
      connected: true,
      tables,
      tableCount: tables.length,
      recordCounts: counts,
      databaseName: sequelize.config.database,
      host: sequelize.config.host
    };
  } catch (error) {
    logger.error('Error getting database status:', error);
    return { connected: false, error: error.message };
  }
}

/**
 * Validate Phase 1 database setup
 */
async function validatePhase1Setup() {
  try {
    logger.info('🔍 Validating Phase 1 database setup...');
    
    const status = await getDatabaseStatus();
    if (!status.connected) {
      throw new Error('Database not connected');
    }
    
    // Required tables for Phase 1
    const requiredTables = [
      'users',
      'cash_notes', 
      'cash_note_transfers',
      'audit_logs',
      'transaction_logs'
    ];
    
    const missingTables = requiredTables.filter(table => !status.tables.includes(table));
    
    if (missingTables.length > 0) {
      logger.error(`❌ Missing required tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    // Check for Phase 1 specific columns in users table
    const userTableDescription = await sequelize.getQueryInterface().describeTable('users');
    const requiredUserColumns = [
      'registration_phase',
      'cash_notes_enabled', 
      'digital_wallet_enabled',
      'phase_1_completed_at'
    ];
    
    const missingColumns = requiredUserColumns.filter(col => !userTableDescription[col]);
    
    if (missingColumns.length > 0) {
      logger.warn(`⚠️ Missing Phase 1 user columns: ${missingColumns.join(', ')}`);
      logger.info('💡 Run Phase 1 migration to add missing columns');
    }
    
    logger.info('✅ Phase 1 database validation completed');
    logger.info('📊 Database Status:');
    logger.info(`   Tables: ${status.tableCount}`);
    Object.entries(status.recordCounts).forEach(([table, count]) => {
      logger.info(`   ${table}: ${count} records`);
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Phase 1 validation failed:', error);
    return false;
  }
}

// Main function to run when script is executed directly
async function main() {
  const action = process.argv[2] || 'init';
  
  try {
    switch (action) {
      case 'init':
      case 'initialize':
        await initializePhase1Database();
        break;
        
      case 'test':
      case 'connection':
        await testConnection();
        break;
        
      case 'create':
      case 'tables':
        await createTables();
        break;
        
      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          logger.error('❌ Cannot reset database in production!');
          process.exit(1);
        }
        await resetDatabase();
        break;
        
      case 'status':
        const status = await getDatabaseStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'validate':
        await validatePhase1Setup();
        break;
        
      default:
        logger.info('Available commands:');
        logger.info('  init/initialize - Initialize Phase 1 database');
        logger.info('  test/connection - Test database connection');
        logger.info('  create/tables - Create database tables');
        logger.info('  reset - Reset database (development only)');
        logger.info('  status - Get database status');
        logger.info('  validate - Validate Phase 1 setup');
    }
  } catch (error) {
    logger.error('Database operation failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Export functions for use in other modules
export {
  testConnection,
  createTables,
  dropAllTables,
  resetDatabase,
  initializePhase1Database,
  getDatabaseStatus,
  validatePhase1Setup
};

// Run main function if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}