/**
 * Initial Migration - Create Base Tables
 * Creates the foundational database structure for CASH-DNR system
 */

import { sequelize } from '../config/database.js';
import logger from '../services/logger.js';

/**
 * Run the initial migration - Create base tables
 */
export const up = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    logger.info('🚀 Starting Initial Migration - Base Tables');

    // Create users table first (required for foreign keys)
    logger.info('📝 Creating users table...');
    await queryInterface.createTable('users', {
      id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: sequelize.literal('gen_random_uuid()')
      },
      username: {
        type: 'VARCHAR(50)',
        allowNull: false,
        unique: true
      },
      email: {
        type: 'VARCHAR(255)',
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: 'VARCHAR(255)',
        allowNull: false
      },
      first_name: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      last_name: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      id_number: {
        type: 'VARCHAR(13)',
        allowNull: false,
        unique: true
      },
      date_of_birth: {
        type: 'DATE',
        allowNull: false
      },
      gender: {
        type: 'CHAR(1)',
        allowNull: true
      },
      tax_number: {
        type: 'VARCHAR(20)',
        allowNull: true
      },
      home_address: {
        type: 'JSONB',
        allowNull: true
      },
      phone_number: {
        type: 'VARCHAR(20)',
        allowNull: true
      },
      home_affairs_verified: {
        type: 'BOOLEAN',
        defaultValue: false
      },
      is_verified: {
        type: 'BOOLEAN',
        defaultValue: false
      },
      is_active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for users table
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['id_number']);
    await queryInterface.addIndex('users', ['phone_number']);
    logger.info('✅ Users table created successfully');

    // Create businesses table
    logger.info('📝 Creating businesses table...');
    await queryInterface.createTable('businesses', {
      id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: sequelize.literal('gen_random_uuid()')
      },
      owner_id: {
        type: 'UUID',
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      business_name: {
        type: 'VARCHAR(255)',
        allowNull: false
      },
      registration_number: {
        type: 'VARCHAR(50)',
        allowNull: true,
        unique: true
      },
      tax_number: {
        type: 'VARCHAR(20)',
        allowNull: true
      },
      business_type: {
        type: 'VARCHAR(100)',
        allowNull: true
      },
      address: {
        type: 'JSONB',
        allowNull: true
      },
      contact_info: {
        type: 'JSONB',
        allowNull: true
      },
      is_verified: {
        type: 'BOOLEAN',
        defaultValue: false
      },
      is_active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('businesses', ['owner_id']);
    await queryInterface.addIndex('businesses', ['registration_number']);
    logger.info('✅ Businesses table created successfully');

    // Create transactions table
    logger.info('📝 Creating transactions table...');
    
    // Create transaction type enum
    await sequelize.query(`
      DO 'BEGIN 
        CREATE TYPE "public"."enum_transactions_transaction_type" AS ENUM(
          ''cash_note_transfer'', 
          ''digital_payment'', 
          ''business_payment'', 
          ''tax_payment'', 
          ''fine_payment''
        ); 
      EXCEPTION 
        WHEN duplicate_object THEN null; 
      END';
    `);

    // Create transaction status enum
    await sequelize.query(`
      DO 'BEGIN 
        CREATE TYPE "public"."enum_transactions_status" AS ENUM(
          ''pending'', 
          ''completed'', 
          ''failed'', 
          ''cancelled'', 
          ''disputed''
        ); 
      EXCEPTION 
        WHEN duplicate_object THEN null; 
      END';
    `);

    await queryInterface.createTable('transactions', {
      id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: sequelize.literal('gen_random_uuid()')
      },
      reference: {
        type: 'VARCHAR(50)',
        allowNull: false,
        unique: true
      },
      from_user_id: {
        type: 'UUID',
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_user_id: {
        type: 'UUID',
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      business_id: {
        type: 'UUID',
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      transaction_type: {
        type: '"public"."enum_transactions_transaction_type"',
        allowNull: false
      },
      amount: {
        type: 'DECIMAL(15,2)',
        allowNull: false
      },
      currency: {
        type: 'VARCHAR(3)',
        allowNull: false,
        defaultValue: 'ZAR'
      },
      status: {
        type: '"public"."enum_transactions_status"',
        allowNull: false,
        defaultValue: 'pending'
      },
      purpose: {
        type: 'TEXT',
        allowNull: true
      },
      metadata: {
        type: 'JSONB',
        allowNull: true
      },
      processed_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('transactions', ['reference']);
    await queryInterface.addIndex('transactions', ['from_user_id']);
    await queryInterface.addIndex('transactions', ['to_user_id']);
    await queryInterface.addIndex('transactions', ['business_id']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['created_at']);
    logger.info('✅ Transactions table created successfully');

    // Create files table
    logger.info('📝 Creating files table...');
    
    // Create file type enum
    await sequelize.query(`
      DO 'BEGIN 
        CREATE TYPE "public"."enum_files_file_type" AS ENUM(
          ''id_document'', 
          ''proof_of_address'', 
          ''bank_statement'', 
          ''tax_document'', 
          ''business_document'', 
          ''other''
        ); 
      EXCEPTION 
        WHEN duplicate_object THEN null; 
      END';
    `);

    await queryInterface.createTable('files', {
      id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: sequelize.literal('gen_random_uuid()')
      },
      user_id: {
        type: 'UUID',
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      business_id: {
        type: 'UUID',
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      original_name: {
        type: 'VARCHAR(255)',
        allowNull: false
      },
      stored_name: {
        type: 'VARCHAR(255)',
        allowNull: false
      },
      file_path: {
        type: 'VARCHAR(500)',
        allowNull: false
      },
      file_size: {
        type: 'INTEGER',
        allowNull: false
      },
      mime_type: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      file_type: {
        type: '"public"."enum_files_file_type"',
        allowNull: false
      },
      description: {
        type: 'TEXT',
        allowNull: true
      },
      is_verified: {
        type: 'BOOLEAN',
        defaultValue: false
      },
      metadata: {
        type: 'JSONB',
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('files', ['user_id']);
    await queryInterface.addIndex('files', ['business_id']);
    await queryInterface.addIndex('files', ['file_type']);
    logger.info('✅ Files table created successfully');

    logger.info('🎉 Initial Migration completed successfully!');
    logger.info('📊 Base Tables Created:');
    logger.info('   ✓ Users table with authentication and profile data');
    logger.info('   ✓ Businesses table for business entities');
    logger.info('   ✓ Transactions table for payment processing');
    logger.info('   ✓ Files table for document management');

  } catch (error) {
    logger.error('❌ Initial Migration failed:', error.message);
    throw error;
  }
};

/**
 * Rollback the initial migration
 */
export const down = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    logger.info('🔄 Rolling back Initial Migration...');

    // Drop tables in reverse dependency order
    await queryInterface.dropTable('files');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('businesses');
    await queryInterface.dropTable('users');

    // Drop enums
    await sequelize.query('DROP TYPE IF EXISTS "public"."enum_transactions_transaction_type";');
    await sequelize.query('DROP TYPE IF EXISTS "public"."enum_transactions_status";');
    await sequelize.query('DROP TYPE IF EXISTS "public"."enum_files_file_type";');

    logger.info('✅ Initial Migration rollback completed');

  } catch (error) {
    logger.error('❌ Initial Migration rollback failed:', error.message);
    throw error;
  }
};