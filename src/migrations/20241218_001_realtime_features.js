/**
 * Real-time Features Migration
 * Adds indexes and constraints for optimized real-time notifications and updates
 */

import { sequelize } from '../config/database.js';
import logger from '../services/logger.js';

export const up = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    logger.info('🚀 Starting real-time features migration...');

    // Add indexes for better real-time performance
    logger.info('📊 Adding performance indexes...');
    
    // Notifications indexes for real-time queries
    try {
      await queryInterface.addIndex('notifications', ['user_id', 'status'], {
        name: 'idx_notifications_user_status',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_notifications_user_status might already exist');
    }

    try {
      await queryInterface.addIndex('notifications', ['created_at'], {
        name: 'idx_notifications_created_at',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_notifications_created_at might already exist');
    }

    try {
      await queryInterface.addIndex('notifications', ['type', 'status'], {
        name: 'idx_notifications_type_status',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_notifications_type_status might already exist');
    }

    // User activities indexes for activity feed
    try {
      await queryInterface.addIndex('user_activities', ['user_id', 'type'], {
        name: 'idx_user_activities_user_type',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_user_activities_user_type might already exist');
    }

    try {
      await queryInterface.addIndex('user_activities', ['created_at'], {
        name: 'idx_user_activities_created_at',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_user_activities_created_at might already exist');
    }

    // Cash notes indexes for balance updates
    try {
      await queryInterface.addIndex('cash_notes', ['current_owner_id', 'status'], {
        name: 'idx_cash_notes_owner_status',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_cash_notes_owner_status might already exist');
    }

    // Transactions indexes for real-time transaction updates
    try {
      await queryInterface.addIndex('transactions', ['from_user_id'], {
        name: 'idx_transactions_from_user',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_transactions_from_user might already exist');
    }

    try {
      await queryInterface.addIndex('transactions', ['to_user_id'], {
        name: 'idx_transactions_to_user',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_transactions_to_user might already exist');
    }

    try {
      await queryInterface.addIndex('transactions', ['status'], {
        name: 'idx_transactions_status',
        transaction
      });
    } catch (error) {
      logger.warn('Index idx_transactions_status might already exist');
    }

    // Add notification expiry cleanup (optional enhancement)
    logger.info('🧹 Adding notification cleanup capabilities...');

    // Create function to cleanup expired notifications (PostgreSQL specific)
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM notifications 
        WHERE expires_at < NOW() 
        AND expires_at IS NOT NULL;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await sequelize.query(cleanupFunction, { transaction });
      logger.info('✅ Notification cleanup function created');
    } catch (error) {
      logger.warn('Cleanup function might already exist or PostgreSQL functions not supported');
    }

    await transaction.commit();
    logger.info('✅ Real-time features migration completed successfully');

  } catch (error) {
    await transaction.rollback();
    logger.error('❌ Real-time features migration failed:', error);
    throw error;
  }
};

export const down = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    logger.info('🔄 Rolling back real-time features migration...');

    // Remove indexes
    const indexesToRemove = [
      'idx_notifications_user_status',
      'idx_notifications_created_at',
      'idx_notifications_type_status',
      'idx_user_activities_user_type',
      'idx_user_activities_created_at',
      'idx_cash_notes_owner_status',
      'idx_transactions_from_user',
      'idx_transactions_to_user',
      'idx_transactions_status'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('notifications', indexName, { transaction });
      } catch (error) {
        logger.warn(`Index ${indexName} might not exist`);
      }
    }

    // Drop cleanup function
    try {
      await sequelize.query('DROP FUNCTION IF EXISTS cleanup_expired_notifications();', { transaction });
    } catch (error) {
      logger.warn('Cleanup function might not exist');
    }

    await transaction.commit();
    logger.info('✅ Real-time features migration rollback completed');

  } catch (error) {
    await transaction.rollback();
    logger.error('❌ Real-time features migration rollback failed:', error);
    throw error;
  }
};
