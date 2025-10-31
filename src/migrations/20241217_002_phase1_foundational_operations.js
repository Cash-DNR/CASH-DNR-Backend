/**
 * Phase 1 Database Migration - Foundational Operations
 * Creates tables and fields needed for Phase 1 cash note management
 *
 * Run this migration after setting up Phase 1 models
 */

import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';
import logger from '../services/logger.js';

const MIGRATION_NAME = '20241217_002_phase1_foundational_operations';

/**
 * Create Cash Notes table
 */
const createCashNotesTable = async(queryInterface) => {
  await queryInterface.createTable('cash_notes', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reference_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    denomination: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    note_type: {
      type: DataTypes.ENUM('ZAR_10', 'ZAR_20', 'ZAR_50', 'ZAR_100', 'ZAR_200', 'FOREIGN'),
      allowNull: false,
      defaultValue: 'ZAR_10'
    },
    serial_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'transferred', 'locked', 'stolen', 'foreign', 'disputed', 'destroyed'),
      allowNull: false,
      defaultValue: 'active'
    },
    current_owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    original_owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    last_transferred_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transfer_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    locked_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    locked_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    locked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_foreign: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    foreign_currency: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    exchange_rate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    flagged_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    flagged_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    flagged_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    qr_code_data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    barcode_data: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    scan_method: {
      type: DataTypes.ENUM('qr_code', 'barcode', 'manual_entry', 'speedpoint', 'mobile_camera'),
      allowNull: true
    },
    verification_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create indexes for cash_notes
  await queryInterface.addIndex('cash_notes', ['reference_code'], { unique: true });
  await queryInterface.addIndex('cash_notes', ['current_owner_id']);
  await queryInterface.addIndex('cash_notes', ['status']);
  await queryInterface.addIndex('cash_notes', ['serial_number'], { where: { serial_number: { [sequelize.Sequelize.Op.ne]: null } } });
  await queryInterface.addIndex('cash_notes', ['created_at']);
  await queryInterface.addIndex('cash_notes', ['is_foreign', 'foreign_currency']);
};

/**
 * Create Cash Note Transfers table
 */
const createCashNoteTransfersTable = async(queryInterface) => {
  await queryInterface.createTable('cash_note_transfers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transfer_reference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    cash_note_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cash_notes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    from_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    to_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    transfer_method: {
      type: DataTypes.ENUM('qr_scan', 'barcode_scan', 'manual_entry', 'speedpoint', 'ussd', 'digital_confirm'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'disputed', 'reversed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Phase 1 Proxy transaction fields
    is_proxy_transaction: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    proxy_type: {
      type: DataTypes.ENUM('family_member', 'guardian', 'business_agent', 'authorized_representative'),
      allowNull: true
    },
    proxy_authorized_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    proxy_authorization_method: {
      type: DataTypes.ENUM('ussd', 'digital_confirm', 'sms', 'phone_call'),
      allowNull: true
    },
    proxy_authorization_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    proxy_authorization_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Transaction context
    transaction_context: {
      type: DataTypes.ENUM('p2p', 'business_purchase', 'service_payment', 'family_transfer', 'proxy_spending'),
      allowNull: true
    },
    business_context: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // Security fields
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    device_fingerprint: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    verification_method: {
      type: DataTypes.ENUM('pin', 'biometric', 'otp', 'ussd_code', 'digital_signature'),
      allowNull: true
    },
    risk_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    // Foreign currency handling (Phase 1)
    requires_home_affairs_validation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    home_affairs_validated: {
      type: DataTypes.BOOLEAN,
      defaultValue: null
    },
    home_affairs_validation_reference: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Timing
    initiated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Failure and disputes
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dispute_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disputed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    disputed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Reversal tracking
    is_reversible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_reversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reversed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reversed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reversal_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Additional metadata
    notes: {
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
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create indexes for cash_note_transfers
  await queryInterface.addIndex('cash_note_transfers', ['transfer_reference'], { unique: true });
  await queryInterface.addIndex('cash_note_transfers', ['cash_note_id']);
  await queryInterface.addIndex('cash_note_transfers', ['from_user_id']);
  await queryInterface.addIndex('cash_note_transfers', ['to_user_id']);
  await queryInterface.addIndex('cash_note_transfers', ['status']);
  await queryInterface.addIndex('cash_note_transfers', ['initiated_at']);
  await queryInterface.addIndex('cash_note_transfers', ['is_proxy_transaction', 'proxy_authorized_by']);
  await queryInterface.addIndex('cash_note_transfers', ['requires_home_affairs_validation', 'home_affairs_validated']);
  await queryInterface.addIndex('cash_note_transfers', ['risk_score']);
};

/**
 * Add Phase 1 fields to users table
 */
const addPhase1FieldsToUsers = async(queryInterface) => {
  const tableDescription = await queryInterface.describeTable('users');

  // Add Phase 1 specific fields if they don't exist
  const fieldsToAdd = [
    {
      name: 'registration_phase',
      definition: {
        type: DataTypes.ENUM('phase_1_complete', 'phase_2_complete', 'phase_3_complete'),
        allowNull: true,
        defaultValue: 'phase_1_complete'
      }
    },
    {
      name: 'cash_notes_enabled',
      definition: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      name: 'digital_wallet_enabled',
      definition: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      name: 'phase_1_completed_at',
      definition: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      name: 'income_type',
      definition: {
        type: DataTypes.ENUM('salary', 'business'),
        allowNull: true
      }
    },
    {
      name: 'annual_income',
      definition: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      }
    },
    {
      name: 'tax_bracket',
      definition: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true
      }
    },
    {
      name: 'estimated_annual_tax',
      definition: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
      }
    },
    {
      name: 'cash_holding_limit',
      definition: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 25000.00,
        comment: 'Phase 1: R25,000 cash holding limit'
      }
    }
  ];

  for (const field of fieldsToAdd) {
    if (!tableDescription[field.name]) {
      await queryInterface.addColumn('users', field.name, field.definition);
      logger.info(`Added column ${field.name} to users table`);
    }
  }
};

/**
 * Run the Phase 1 migration
 */
export const up = async() => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    logger.info('🚀 Starting Phase 1 Migration - Foundational Operations');

    // Check if tables already exist
    const existingTables = await queryInterface.showAllTables();

    // Create cash_notes table
    if (!existingTables.includes('cash_notes')) {
      logger.info('📝 Creating cash_notes table...');
      await createCashNotesTable(queryInterface);
      logger.info('✅ cash_notes table created successfully');
    } else {
      logger.info('ℹ️ cash_notes table already exists');
    }

    // Create cash_note_transfers table
    if (!existingTables.includes('cash_note_transfers')) {
      logger.info('📝 Creating cash_note_transfers table...');
      await createCashNoteTransfersTable(queryInterface);
      logger.info('✅ cash_note_transfers table created successfully');
    } else {
      logger.info('ℹ️ cash_note_transfers table already exists');
    }

    // Add Phase 1 fields to users table
    logger.info('📝 Adding Phase 1 fields to users table...');
    await addPhase1FieldsToUsers(queryInterface);
    logger.info('✅ Phase 1 fields added to users table');

    logger.info('🎉 Phase 1 Migration completed successfully!');
    logger.info('📊 Phase 1 Features Now Available:');
    logger.info('   ✓ Cash note scanning and registration');
    logger.info('   ✓ Digital ownership tracking');
    logger.info('   ✓ Peer-to-peer transfers');
    logger.info('   ✓ Proxy transactions (family/middleman)');
    logger.info('   ✓ Fraud prevention (stolen note flagging)');
    logger.info('   ✓ Foreign currency transfers with Home Affairs validation');
    logger.info('   ✓ Automatic tax number generation');
    logger.info('   ✓ Comprehensive audit trails');

  } catch (error) {
    logger.error('❌ Phase 1 Migration failed:', error);
    throw error;
  }
};

/**
 * Rollback the Phase 1 migration
 */
export const down = async() => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    logger.info('⬇️ Rolling back Phase 1 Migration...');

    // Drop tables in reverse order (to handle foreign key constraints)
    await queryInterface.dropTable('cash_note_transfers');
    logger.info('🗑️ Dropped cash_note_transfers table');

    await queryInterface.dropTable('cash_notes');
    logger.info('🗑️ Dropped cash_notes table');

    // Remove Phase 1 fields from users table
    const phase1Fields = [
      'registration_phase', 'cash_notes_enabled', 'digital_wallet_enabled',
      'phase_1_completed_at', 'income_type', 'annual_income',
      'tax_bracket', 'estimated_annual_tax', 'cash_holding_limit'
    ];

    for (const field of phase1Fields) {
      try {
        await queryInterface.removeColumn('users', field);
        logger.info(`🗑️ Removed column ${field} from users table`);
      } catch (error) {
        logger.warn(`⚠️ Could not remove column ${field}: ${error.message}`);
      }
    }

    logger.info('✅ Phase 1 Migration rollback completed');

  } catch (error) {
    logger.error('❌ Phase 1 Migration rollback failed:', error);
    throw error;
  }
};

export default {
  up,
  down,
  name: MIGRATION_NAME
};
