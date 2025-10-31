/**
 * Initial Migration - Base Tables
 * Creates the foundational database structure for CASH-DNR
 */

import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import logger from '../services/logger.js';

/**
 * Run the initial migration
 */
export async function up() {
  try {
    logger.info('🚀 Starting Initial Migration - Base Tables');

    const queryInterface = sequelize.getQueryInterface();

    // Create users table first (referenced by other tables)
    logger.info('📝 Creating users table...');
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      id_number: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: true,
        validate: {
          len: [13, 13],
          isNumeric: true
        }
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      home_address: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      tax_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user',
        allowNull: false
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      home_affairs_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for users table
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['id_number']);
    await queryInterface.addIndex('users', ['username']);

    logger.info('✅ users table created successfully');

    // Create businesses table
    logger.info('📝 Creating businesses table...');
    await queryInterface.createTable('businesses', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      business_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      registration_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
      },
      business_type: {
        type: DataTypes.ENUM('sole_proprietorship', 'partnership', 'company', 'npc', 'trust'),
        allowNull: false
      },
      industry: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      business_address: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      contact_details: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      tax_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('businesses', ['owner_id']);
    await queryInterface.addIndex('businesses', ['registration_number']);

    logger.info('✅ businesses table created successfully');

    // Create transactions table
    logger.info('📝 Creating transactions table...');
    await queryInterface.createTable('transactions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      business_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      reference: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      transaction_type: {
        type: DataTypes.ENUM('income', 'expense', 'transfer', 'investment', 'loan'),
        allowNull: false
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      purpose: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['business_id']);
    await queryInterface.addIndex('transactions', ['reference']);
    await queryInterface.addIndex('transactions', ['transaction_date']);

    logger.info('✅ transactions table created successfully');

    // Create files table
    logger.info('📝 Creating files table...');
    await queryInterface.createTable('files', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      original_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      file_type: {
        type: DataTypes.ENUM('id_document', 'proof_of_address', 'bank_statement', 'tax_document', 'other'),
        allowNull: false
      },
      upload_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      verification_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('files', ['user_id']);
    await queryInterface.addIndex('files', ['file_type']);
    await queryInterface.addIndex('files', ['upload_date']);

    logger.info('✅ files table created successfully');

    logger.info('🎉 Initial Migration completed successfully!');
    logger.info('📊 Base tables created:');
    logger.info('   ✓ users');
    logger.info('   ✓ businesses');
    logger.info('   ✓ transactions');
    logger.info('   ✓ files');

  } catch (error) {
    logger.error('❌ Initial Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback the initial migration
 */
export async function down() {
  try {
    logger.info('🔄 Rolling back Initial Migration...');

    const queryInterface = sequelize.getQueryInterface();

    // Drop tables in reverse order of creation (to handle foreign keys)
    await queryInterface.dropTable('files');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('businesses');
    await queryInterface.dropTable('users');

    logger.info('✅ Initial Migration rollback completed');

  } catch (error) {
    logger.error('❌ Initial Migration rollback failed:', error);
    throw error;
  }
}
