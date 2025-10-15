/**
 * Database Seeding Utility for Phase 1 Testing
 * Creates sample data for development and testing
 */

import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';
import logger from '../services/logger.js';

// Import models
import { User, Business, CashNote, CashNoteTransfer, AuditLog } from '../models/index.js';

/**
 * Create sample users for testing
 */
async function seedUsers() {
  try {
    logger.info('👥 Seeding sample users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const sampleUsers = [
      {
        username: 'john.doe',
        email: 'john.doe@example.com',
        password_hash: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        id_number: '0001010001088',
        date_of_birth: '2000-01-01',
        gender: 'Male',
        tax_number: '1234567890',
        phone_number: '+27 82 123 4567',
        home_affairs_verified: true,
        is_verified: true,
        is_active: true,
        registration_phase: 'phase_1_complete',
        cash_notes_enabled: true,
        digital_wallet_enabled: true,
        phase_1_completed_at: new Date(),
        cash_holding_limit: 25000.00
      },
      {
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        password_hash: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        id_number: '0002020002099',
        date_of_birth: '2000-02-02',
        gender: 'Female',
        tax_number: '2345678901',
        phone_number: '+27 83 234 5678',
        home_affairs_verified: true,
        is_verified: true,
        is_active: true,
        registration_phase: 'phase_1_complete',
        cash_notes_enabled: true,
        digital_wallet_enabled: true,
        phase_1_completed_at: new Date(),
        cash_holding_limit: 25000.00
      },
      {
        username: 'mike.wilson',
        email: 'mike.wilson@example.com',
        password_hash: hashedPassword,
        first_name: 'Mike',
        last_name: 'Wilson',
        id_number: '0003030003077',
        date_of_birth: '2000-03-03',
        gender: 'Male',
        tax_number: '3456789012',
        phone_number: '+27 84 345 6789',
        home_affairs_verified: true,
        is_verified: true,
        is_active: true,
        registration_phase: 'phase_1_complete',
        cash_notes_enabled: true,
        digital_wallet_enabled: true,
        phase_1_completed_at: new Date(),
        cash_holding_limit: 25000.00
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      
      if (created) {
        logger.info(`✅ Created user: ${user.username}`);
      } else {
        logger.info(`ℹ️ User already exists: ${user.username}`);
      }
      
      createdUsers.push(user);
    }
    
    return createdUsers;
  } catch (error) {
    logger.error('❌ Error seeding users:', error);
    throw error;
  }
}

/**
 * Create sample cash notes for testing
 */
async function seedCashNotes(users) {
  try {
    logger.info('💰 Seeding sample cash notes...');
    
    const sampleCashNotes = [
      {
        reference_code: 'CN-241217-1001-45',
        denomination: 10.00,
        note_type: 'ZAR_10',
        current_owner_id: users[0].id,
        original_owner_id: users[0].id,
        scan_method: 'mobile_camera',
        verification_score: 0.95,
        metadata: { source: 'seed_data' }
      },
      {
        reference_code: 'CN-241217-1002-56',
        denomination: 20.00,
        note_type: 'ZAR_20',
        current_owner_id: users[0].id,
        original_owner_id: users[0].id,
        scan_method: 'qr_code',
        verification_score: 0.98,
        metadata: { source: 'seed_data' }
      },
      {
        reference_code: 'CN-241217-1003-67',
        denomination: 50.00,
        note_type: 'ZAR_50',
        current_owner_id: users[1].id,
        original_owner_id: users[1].id,
        scan_method: 'speedpoint',
        verification_score: 0.97,
        metadata: { source: 'seed_data' }
      },
      {
        reference_code: 'CN-241217-1004-78',
        denomination: 100.00,
        note_type: 'ZAR_100',
        current_owner_id: users[1].id,
        original_owner_id: users[1].id,
        scan_method: 'barcode',
        verification_score: 0.96,
        metadata: { source: 'seed_data' }
      },
      {
        reference_code: 'CN-241217-1005-89',
        denomination: 200.00,
        note_type: 'ZAR_200',
        current_owner_id: users[2].id,
        original_owner_id: users[2].id,
        scan_method: 'manual_entry',
        verification_score: 0.94,
        metadata: { source: 'seed_data' }
      }
    ];
    
    const createdNotes = [];
    
    for (const noteData of sampleCashNotes) {
      const [note, created] = await CashNote.findOrCreate({
        where: { reference_code: noteData.reference_code },
        defaults: noteData
      });
      
      if (created) {
        logger.info(`✅ Created cash note: ${note.reference_code} (${note.note_type})`);
      } else {
        logger.info(`ℹ️ Cash note already exists: ${note.reference_code}`);
      }
      
      createdNotes.push(note);
    }
    
    return createdNotes;
  } catch (error) {
    logger.error('❌ Error seeding cash notes:', error);
    throw error;
  }
}

/**
 * Create sample transfers for testing
 */
async function seedTransfers(users, cashNotes) {
  try {
    logger.info('🔄 Seeding sample transfers...');
    
    const sampleTransfers = [
      {
        cash_note_id: cashNotes[0].id,
        from_user_id: users[0].id,
        to_user_id: users[1].id,
        transfer_method: 'digital_confirm',
        status: 'completed',
        amount: cashNotes[0].denomination,
        transaction_context: 'p2p',
        completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        metadata: { source: 'seed_data', notes: 'Test transfer' }
      },
      {
        cash_note_id: cashNotes[1].id,
        from_user_id: users[0].id,
        to_user_id: users[2].id,
        transfer_method: 'qr_scan',
        status: 'completed',
        amount: cashNotes[1].denomination,
        transaction_context: 'business_purchase',
        completed_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        metadata: { source: 'seed_data', notes: 'Coffee purchase' }
      }
    ];
    
    const createdTransfers = [];
    
    for (const transferData of sampleTransfers) {
      const [transfer, created] = await CashNoteTransfer.findOrCreate({
        where: { 
          cash_note_id: transferData.cash_note_id,
          from_user_id: transferData.from_user_id,
          to_user_id: transferData.to_user_id
        },
        defaults: transferData
      });
      
      if (created) {
        logger.info(`✅ Created transfer: ${transfer.transfer_reference}`);
        
        // Update cash note ownership
        const cashNote = await CashNote.findByPk(transferData.cash_note_id);
        if (cashNote) {
          await cashNote.update({
            current_owner_id: transferData.to_user_id,
            last_transferred_at: transferData.completed_at,
            transfer_count: cashNote.transfer_count + 1
          });
        }
      } else {
        logger.info(`ℹ️ Transfer already exists: ${transfer.transfer_reference}`);
      }
      
      createdTransfers.push(transfer);
    }
    
    return createdTransfers;
  } catch (error) {
    logger.error('❌ Error seeding transfers:', error);
    throw error;
  }
}

/**
 * Create sample audit logs for testing
 */
async function seedAuditLogs(users, cashNotes) {
  try {
    logger.info('📝 Seeding sample audit logs...');
    
    const sampleAuditLogs = [
      {
        user_id: users[0].id,
        action_type: 'REGISTER',
        entity_type: 'CASH_NOTE',
        entity_id: cashNotes[0].id,
        severity: 'INFO',
        description: `Cash note ${cashNotes[0].reference_code} registered by ${users[0].username}`,
        new_values: {
          reference_code: cashNotes[0].reference_code,
          denomination: cashNotes[0].denomination,
          scan_method: cashNotes[0].scan_method
        },
        metadata: { source: 'seed_data' }
      },
      {
        user_id: users[1].id,
        action_type: 'TRANSFER',
        entity_type: 'CASH_NOTE',
        entity_id: cashNotes[0].id,
        severity: 'INFO',
        description: `Cash note ${cashNotes[0].reference_code} transferred from ${users[0].username} to ${users[1].username}`,
        old_values: { owner: users[0].username },
        new_values: { owner: users[1].username },
        metadata: { source: 'seed_data' }
      },
      {
        user_id: users[0].id,
        action_type: 'LOGIN',
        entity_type: 'USER',
        entity_id: users[0].id,
        severity: 'INFO',
        description: `User ${users[0].username} logged in`,
        metadata: { source: 'seed_data', ip_address: '127.0.0.1' }
      }
    ];
    
    const createdLogs = [];
    
    for (const logData of sampleAuditLogs) {
      const log = await AuditLog.create(logData);
      logger.info(`✅ Created audit log: ${log.action_type} for ${log.entity_type}`);
      createdLogs.push(log);
    }
    
    return createdLogs;
  } catch (error) {
    logger.error('❌ Error seeding audit logs:', error);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding for Phase 1...');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // Seed in order (respecting foreign key constraints)
    const users = await seedUsers();
    const cashNotes = await seedCashNotes(users);
    const transfers = await seedTransfers(users, cashNotes);
    const auditLogs = await seedAuditLogs(users, cashNotes);
    
    logger.info('🎉 Database seeding completed successfully!');
    logger.info('📊 Seeded Data Summary:');
    logger.info(`   Users: ${users.length}`);
    logger.info(`   Cash Notes: ${cashNotes.length}`);
    logger.info(`   Transfers: ${transfers.length}`);
    logger.info(`   Audit Logs: ${auditLogs.length}`);
    
    return {
      users,
      cashNotes,
      transfers,
      auditLogs
    };
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Clear all seeded data
 */
async function clearSeedData() {
  try {
    logger.info('🧹 Clearing seed data...');
    
    // Delete in reverse order to respect foreign key constraints
    await AuditLog.destroy({ where: { 'metadata.source': 'seed_data' } });
    await CashNoteTransfer.destroy({ where: { 'metadata.source': 'seed_data' } });
    await CashNote.destroy({ where: { 'metadata.source': 'seed_data' } });
    
    // Delete seed users (be careful with this)
    const seedUserEmails = [
      'john.doe@example.com',
      'jane.smith@example.com', 
      'mike.wilson@example.com'
    ];
    
    await User.destroy({ where: { email: seedUserEmails } });
    
    logger.info('✅ Seed data cleared');
  } catch (error) {
    logger.error('❌ Error clearing seed data:', error);
    throw error;
  }
}

// Main function for CLI usage
async function main() {
  const action = process.argv[2] || 'seed';
  
  try {
    switch (action) {
      case 'seed':
        await seedDatabase();
        break;
        
      case 'clear':
        await clearSeedData();
        break;
        
      case 'reset':
        await clearSeedData();
        await seedDatabase();
        break;
        
      default:
        logger.info('Available commands:');
        logger.info('  seed - Seed database with sample data');
        logger.info('  clear - Clear all seed data');
        logger.info('  reset - Clear and re-seed database');
    }
  } catch (error) {
    logger.error('Seeding operation failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Export functions
export {
  seedDatabase,
  seedUsers,
  seedCashNotes,
  seedTransfers,
  seedAuditLogs,
  clearSeedData
};

// Run main function if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
