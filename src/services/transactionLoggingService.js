import TransactionLog from '../models/TransactionLog.js';
import AuditLog from '../models/AuditLog.js';
import logger from './logger.js';

class TransactionLoggingService {
  /**
   * Log transaction creation
   */
  static async logTransactionCreated(transaction, userId, requestMetadata = {}) {
    try {
      const logEntry = await TransactionLog.create({
        transaction_id: transaction.id,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.CREATED,
        severity: TransactionLog.SEVERITY.LOW,
        message: `Transaction created: ${transaction.reference} for amount R${transaction.amount}`,
        new_values: {
          amount: transaction.amount,
          purpose: transaction.purpose,
          transaction_type: transaction.transaction_type,
          receiver: transaction.receiver_info,
          tax_classification: transaction.tax_classification
        },
        system_metadata: {
          created_via: requestMetadata.source || 'api',
          request_id: requestMetadata.requestId,
          timestamp: new Date().toISOString()
        },
        ip_address: requestMetadata.ip,
        user_agent: requestMetadata.userAgent,
        session_id: requestMetadata.sessionId
      });

      // Also create audit log entry
      await this.createAuditLogEntry({
        user_id: userId,
        action_type: AuditLog.ACTION_TYPES.CREATE,
        entity_type: AuditLog.ENTITIES.TRANSACTION,
        entity_id: transaction.id,
        severity: AuditLog.SEVERITY.INFO,
        description: `Created transaction ${transaction.reference}`,
        new_values: {
          reference: transaction.reference,
          amount: transaction.amount,
          purpose: transaction.purpose
        },
        metadata: requestMetadata
      });

      logger.info(`Transaction creation logged: ${transaction.id}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging transaction creation:', error);
      throw error;
    }
  }

  /**
   * Log transaction update
   */
  static async logTransactionUpdated(transactionId, oldValues, newValues, userId, requestMetadata = {}) {
    try {
      const changes = this.getChangedFields(oldValues, newValues);
      
      const logEntry = await TransactionLog.create({
        transaction_id: transactionId,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.UPDATED,
        severity: this.getSeverityForUpdate(changes),
        message: `Transaction updated: ${Object.keys(changes).join(', ')} changed`,
        old_values: oldValues,
        new_values: newValues,
        system_metadata: {
          changes_made: changes,
          updated_via: requestMetadata.source || 'api',
          request_id: requestMetadata.requestId
        },
        ip_address: requestMetadata.ip,
        user_agent: requestMetadata.userAgent,
        session_id: requestMetadata.sessionId,
        admin_user_id: requestMetadata.adminUserId
      });

      await this.createAuditLogEntry({
        user_id: userId,
        action_type: AuditLog.ACTION_TYPES.UPDATE,
        entity_type: AuditLog.ENTITIES.TRANSACTION,
        entity_id: transactionId,
        severity: AuditLog.SEVERITY.INFO,
        description: `Updated transaction fields: ${Object.keys(changes).join(', ')}`,
        old_values: oldValues,
        new_values: newValues,
        metadata: requestMetadata
      });

      logger.info(`Transaction update logged: ${transactionId}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging transaction update:', error);
      throw error;
    }
  }

  /**
   * Log transaction status change
   */
  static async logStatusChange(transactionId, oldStatus, newStatus, userId, reason = '', requestMetadata = {}) {
    try {
      const severity = this.getSeverityForStatusChange(oldStatus, newStatus);
      
      const logEntry = await TransactionLog.create({
        transaction_id: transactionId,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.STATUS_CHANGED,
        severity,
        message: `Status changed from ${oldStatus} to ${newStatus}${reason ? `: ${reason}` : ''}`,
        old_values: { status: oldStatus },
        new_values: { status: newStatus, reason },
        system_metadata: {
          status_change: {
            from: oldStatus,
            to: newStatus,
            reason
          },
          timestamp: new Date().toISOString()
        },
        ip_address: requestMetadata.ip,
        user_agent: requestMetadata.userAgent,
        session_id: requestMetadata.sessionId,
        admin_user_id: requestMetadata.adminUserId
      });

      await this.createAuditLogEntry({
        user_id: userId,
        action_type: AuditLog.ACTION_TYPES.UPDATE,
        entity_type: AuditLog.ENTITIES.TRANSACTION,
        entity_id: transactionId,
        severity: severity === TransactionLog.SEVERITY.HIGH ? AuditLog.SEVERITY.WARNING : AuditLog.SEVERITY.INFO,
        description: `Transaction status changed from ${oldStatus} to ${newStatus}`,
        old_values: { status: oldStatus },
        new_values: { status: newStatus },
        metadata: { ...requestMetadata, reason }
      });

      logger.info(`Transaction status change logged: ${transactionId} (${oldStatus} -> ${newStatus})`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging transaction status change:', error);
      throw error;
    }
  }

  /**
   * Log transaction flagged for review
   */
  static async logTransactionFlagged(transactionId, userId, flags, reason, requestMetadata = {}) {
    try {
      const logEntry = await TransactionLog.create({
        transaction_id: transactionId,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.FLAGGED,
        severity: TransactionLog.SEVERITY.HIGH,
        message: `Transaction flagged for review: ${reason}`,
        new_values: {
          flags,
          flagged_reason: reason,
          flagged_at: new Date().toISOString()
        },
        system_metadata: {
          flags_raised: flags,
          flagging_criteria: reason
        },
        ip_address: requestMetadata.ip,
        user_agent: requestMetadata.userAgent,
        admin_user_id: requestMetadata.adminUserId
      });

      await this.createAuditLogEntry({
        user_id: userId,
        action_type: AuditLog.ACTION_TYPES.UPDATE,
        entity_type: AuditLog.ENTITIES.TRANSACTION,
        entity_id: transactionId,
        severity: AuditLog.SEVERITY.WARNING,
        description: `Transaction flagged for review: ${reason}`,
        new_values: { flags, reason },
        metadata: requestMetadata
      });

      logger.warn(`Transaction flagged: ${transactionId} - ${reason}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging transaction flagging:', error);
      throw error;
    }
  }

  /**
   * Log tax classification action
   */
  static async logTaxClassification(transactionId, userId, classificationData, requestMetadata = {}) {
    try {
      const logEntry = await TransactionLog.create({
        transaction_id: transactionId,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.TAX_CLASSIFIED,
        severity: classificationData.confidence_score > 60 ? TransactionLog.SEVERITY.LOW : TransactionLog.SEVERITY.MEDIUM,
        message: `Tax classification: ${classificationData.tax_classification} (confidence: ${classificationData.confidence_score}%)`,
        new_values: {
          tax_classification: classificationData.tax_classification,
          confidence_score: classificationData.confidence_score
        },
        tax_details: classificationData,
        system_metadata: {
          classification_method: 'automated',
          processing_timestamp: new Date().toISOString()
        },
        ip_address: requestMetadata.ip,
        user_agent: requestMetadata.userAgent
      });

      logger.info(`Tax classification logged: ${transactionId} - ${classificationData.tax_classification}`);
      return logEntry;
    } catch (error) {
      logger.error('Error logging tax classification:', error);
      throw error;
    }
  }

  /**
   * Get transaction logs for a specific transaction
   */
  static async getTransactionLogs(transactionId, options = {}) {
    try {
      const { page = 1, limit = 50, logType = null } = options;
      
      const whereClause = { transaction_id: transactionId };
      if (logType) {
        whereClause.log_type = logType;
      }

      const logs = await TransactionLog.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'admin_user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          }
        ]
      });

      return {
        logs: logs.rows,
        total: logs.count,
        page,
        totalPages: Math.ceil(logs.count / limit)
      };
    } catch (error) {
      logger.error('Error retrieving transaction logs:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for multiple transactions
   */
  static async getAuditTrail(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 100 } = options;
      const whereClause = {};

      if (filters.userId) whereClause.user_id = filters.userId;
      if (filters.entityType) whereClause.entity_type = filters.entityType;
      if (filters.actionType) whereClause.action_type = filters.actionType;
      if (filters.dateFrom) {
        whereClause.created_at = {
          [Op.gte]: filters.dateFrom
        };
      }
      if (filters.dateTo) {
        whereClause.created_at = {
          ...whereClause.created_at,
          [Op.lte]: filters.dateTo
        };
      }

      const logs = await AuditLog.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name']
          }
        ]
      });

      return {
        logs: logs.rows,
        total: logs.count,
        page,
        totalPages: Math.ceil(logs.count / limit)
      };
    } catch (error) {
      logger.error('Error retrieving audit trail:', error);
      throw error;
    }
  }

  /**
   * Helper method to create audit log entries
   */
  static async createAuditLogEntry(data) {
    try {
      return await AuditLog.create({
        user_id: data.user_id,
        action_type: data.action_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        severity: data.severity,
        description: data.description,
        old_values: data.old_values,
        new_values: data.new_values,
        metadata: data.metadata,
        ip_address: data.metadata?.ip,
        user_agent: data.metadata?.userAgent,
        session_id: data.metadata?.sessionId,
        request_id: data.metadata?.requestId
      });
    } catch (error) {
      logger.error('Error creating audit log entry:', error);
      // Don't throw here to prevent audit logging from breaking main functionality
    }
  }

  /**
   * Helper to identify changed fields
   */
  static getChangedFields(oldValues, newValues) {
    const changes = {};
    
    Object.keys(newValues).forEach(key => {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        };
      }
    });

    return changes;
  }

  /**
   * Determine severity for updates based on what changed
   */
  static getSeverityForUpdate(changes) {
    const criticalFields = ['amount', 'receiver_info', 'tax_classification'];
    const highFields = ['status', 'purpose'];

    if (Object.keys(changes).some(field => criticalFields.includes(field))) {
      return TransactionLog.SEVERITY.HIGH;
    }
    
    if (Object.keys(changes).some(field => highFields.includes(field))) {
      return TransactionLog.SEVERITY.MEDIUM;
    }

    return TransactionLog.SEVERITY.LOW;
  }

  /**
   * Determine severity for status changes
   */
  static getSeverityForStatusChange(oldStatus, newStatus) {
    const criticalStatuses = ['FAILED', 'FLAGGED'];
    const highStatuses = ['UNDER_REVIEW'];

    if (criticalStatuses.includes(newStatus)) {
      return TransactionLog.SEVERITY.CRITICAL;
    }

    if (highStatuses.includes(newStatus)) {
      return TransactionLog.SEVERITY.HIGH;
    }

    if (newStatus === 'COMPLETED') {
      return TransactionLog.SEVERITY.LOW;
    }

    return TransactionLog.SEVERITY.MEDIUM;
  }
}

export default TransactionLoggingService;
