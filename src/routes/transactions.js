import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Transaction, User, TransactionLog } from '../models/index.js';
import logger from '../services/logger.js';
import TaxTaggingService from '../services/taxTaggingService.js';
import TransactionLoggingService from '../services/transactionLoggingService.js';

const router = express.Router();

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('purpose')
    .notEmpty()
    .withMessage('Transaction purpose is required')
    .isLength({ max: 255 }),
  body('userId')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('transactionType')
    .isIn(Object.values(Transaction.TYPES))
    .withMessage('Invalid transaction type'),
  body('cashNoteSerial')
    .optional()
    .isLength({ min: 8, max: 50 }),
  body('digitalReference')
    .optional()
    .isLength({ min: 8, max: 50 }),
  body('receiverInfo')
    .isObject()
    .withMessage('Receiver information is required'),
  body('receiverInfo.name')
    .notEmpty()
    .withMessage('Receiver name is required'),
  body('receiverInfo.taxId')
    .notEmpty()
    .withMessage('Receiver tax ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      purpose,
      userId,
      transactionType,
      cashNoteSerial,
      digitalReference,
      receiverInfo,
      metadata
    } = req.body;

    // Generate transaction reference
    const reference = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Auto-classify transaction for tax purposes
    const taxClassification = await TaxTaggingService.classifyTransaction({
      amount,
      purpose,
      transaction_type: transactionType,
      receiver_info: receiverInfo,
      user_id: userId
    });

    // Create transaction with tax classification
    const transaction = await Transaction.create({
      reference,
      user_id: userId,
      amount,
      purpose,
      transaction_type: transactionType,
      cash_note_serial: cashNoteSerial,
      digital_reference: digitalReference,
      receiver_info: receiverInfo,
      metadata,
      tax_classification: taxClassification.tax_classification,
      status: Transaction.STATUS.COMPLETED
    });

    // Log transaction creation and tax classification
    const requestMetadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
      source: 'api'
    };

    await TransactionLoggingService.logTransactionCreated(transaction, userId, requestMetadata);
    await TaxTaggingService.logTaxClassification(transaction.id, userId, taxClassification, requestMetadata);

    // Check for flags and log if necessary
    if (taxClassification.flags && taxClassification.flags.length > 0) {
      await TransactionLoggingService.logTransactionFlagged(
        transaction.id,
        userId,
        taxClassification.flags,
        `Automated flagging: ${taxClassification.flags.join(', ')}`,
        requestMetadata
      );
    }

    logger.info(`✅ Transaction created with tax classification: ${reference} - ${taxClassification.tax_classification}`);

    res.status(201).json({
      success: true,
      message: 'Transaction logged successfully with tax classification',
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        purpose: transaction.purpose,
        transactionType: transaction.transaction_type,
        taxClassification: transaction.tax_classification,
        status: transaction.status,
        timestamp: transaction.created_at,
        receiver: receiverInfo
      },
      taxAnalysis: {
        classification: taxClassification.tax_classification,
        confidenceScore: taxClassification.confidence_score,
        reasoning: taxClassification.reasoning,
        flags: taxClassification.flags,
        taxImplications: taxClassification.tax_implications
      }
    });

  } catch (error) {
    logger.error('Transaction creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during transaction creation'
    });
  }
});

/**
 * @route   GET /api/users/:userId/transactions
 * @desc    Get user transactions
 * @access  Private
 */
router.get('/user/:userId', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative number'),
  query('taxClassification')
    .optional()
    .isIn(Object.values(Transaction.TAX_CLASSIFICATION)),
  query('fromDate')
    .optional()
    .isISO8601(),
  query('toDate')
    .optional()
    .isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { 
      limit = 50, 
      offset = 0,
      taxClassification,
      fromDate,
      toDate
    } = req.query;

    // Build query conditions
    const where = { user_id: userId };
    if (taxClassification) {
      where.tax_classification = taxClassification;
    }
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.$gte = new Date(fromDate);
      if (toDate) where.created_at.$lte = new Date(toDate);
    }

    // Get transactions
    const transactions = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        total: transactions.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching transactions'
    });
  }
});

/**
 * @route   GET /api/transactions/:transactionId/logs
 * @desc    Get logs for a specific transaction
 * @access  Private
 */
router.get('/:transactionId/logs', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { page = 1, limit = 50, logType } = req.query;

    const logs = await TransactionLoggingService.getTransactionLogs(transactionId, {
      page: parseInt(page),
      limit: parseInt(limit),
      logType
    });

    res.json({
      success: true,
      message: 'Transaction logs retrieved successfully',
      data: logs
    });
  } catch (error) {
    logger.error('Error retrieving transaction logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving transaction logs'
    });
  }
});

/**
 * @route   PUT /api/transactions/:transactionId/tax-classification
 * @desc    Update tax classification of a transaction
 * @access  Private (Admin only)
 */
router.put('/:transactionId/tax-classification', [
  body('taxClassification')
    .isIn(Object.values(Transaction.TAX_CLASSIFICATION))
    .withMessage('Invalid tax classification'),
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  body('adminUserId')
    .isUUID()
    .withMessage('Valid admin user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { transactionId } = req.params;
    const { taxClassification, reason, adminUserId } = req.body;

    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const oldClassification = transaction.tax_classification;
    
    // Update transaction
    await transaction.update({ tax_classification: taxClassification });

    // Log the classification change
    const requestMetadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
      adminUserId,
      source: 'admin_manual'
    };

    await TransactionLoggingService.logTransactionUpdated(
      transactionId,
      { tax_classification: oldClassification },
      { tax_classification: taxClassification, reason },
      transaction.user_id,
      requestMetadata
    );

    logger.info(`Tax classification updated for transaction ${transactionId}: ${oldClassification} -> ${taxClassification}`);

    res.json({
      success: true,
      message: 'Tax classification updated successfully',
      data: {
        transactionId,
        previousClassification: oldClassification,
        newClassification: taxClassification,
        updatedBy: adminUserId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error updating tax classification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating tax classification'
    });
  }
});

/**
 * @route   POST /api/transactions/:transactionId/reclassify
 * @desc    Re-run tax classification for a transaction
 * @access  Private
 */
router.post('/:transactionId/reclassify', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Re-run tax classification
    const taxClassification = await TaxTaggingService.classifyTransaction({
      amount: transaction.amount,
      purpose: transaction.purpose,
      transaction_type: transaction.transaction_type,
      receiver_info: transaction.receiver_info,
      user_id: transaction.user_id
    });

    const oldClassification = transaction.tax_classification;
    
    // Update if classification changed
    if (taxClassification.tax_classification !== oldClassification) {
      await transaction.update({ tax_classification: taxClassification.tax_classification });

      // Log the reclassification
      const requestMetadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
        source: 'api_reclassify'
      };

      await TaxTaggingService.logTaxClassification(transaction.id, transaction.user_id, taxClassification, requestMetadata);
    }

    res.json({
      success: true,
      message: 'Transaction reclassified successfully',
      data: {
        transactionId,
        previousClassification: oldClassification,
        newClassification: taxClassification.tax_classification,
        changed: taxClassification.tax_classification !== oldClassification,
        analysis: {
          confidenceScore: taxClassification.confidence_score,
          reasoning: taxClassification.reasoning,
          flags: taxClassification.flags,
          taxImplications: taxClassification.tax_implications
        }
      }
    });
  } catch (error) {
    logger.error('Error reclassifying transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while reclassifying transaction'
    });
  }
});

/**
 * @route   GET /api/transactions/tax-summary/:userId
 * @desc    Get tax summary for a user
 * @access  Private
 */
router.get('/tax-summary/:userId', [
  query('fromDate')
    .isISO8601()
    .withMessage('Valid from date is required'),
  query('toDate')
    .isISO8601()
    .withMessage('Valid to date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { fromDate, toDate } = req.query;

    const summary = await TaxTaggingService.generateTaxSummary(userId, fromDate, toDate);

    res.json({
      success: true,
      message: 'Tax summary generated successfully',
      data: summary
    });
  } catch (error) {
    logger.error('Error generating tax summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating tax summary'
    });
  }
});

/**
 * @route   GET /api/transactions/audit-trail
 * @desc    Get audit trail for transactions
 * @access  Private (Admin only)
 */
router.get('/audit-trail', [
  query('userId').optional().isUUID(),
  query('actionType').optional().isIn(Object.values(TransactionLog.LOG_TYPES)),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const filters = {
      userId: req.query.userId,
      entityType: 'transaction',
      actionType: req.query.actionType,
      dateFrom: req.query.fromDate,
      dateTo: req.query.toDate
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100
    };

    const auditTrail = await TransactionLoggingService.getAuditTrail(filters, options);

    res.json({
      success: true,
      message: 'Audit trail retrieved successfully',
      data: auditTrail
    });
  } catch (error) {
    logger.error('Error retrieving audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving audit trail'
    });
  }
});

/**
 * @route   PUT /api/transactions/:transactionId/flag
 * @desc    Flag a transaction for review
 * @access  Private (Admin only)
 */
router.put('/:transactionId/flag', [
  body('reason')
    .notEmpty()
    .withMessage('Flagging reason is required')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),
  body('flags')
    .isArray()
    .withMessage('Flags must be an array'),
  body('adminUserId')
    .isUUID()
    .withMessage('Valid admin user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { transactionId } = req.params;
    const { reason, flags, adminUserId } = req.body;

    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status to flagged
    await transaction.update({ status: Transaction.STATUS.FLAGGED });

    // Log the flagging
    const requestMetadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
      adminUserId,
      source: 'admin_flag'
    };

    await TransactionLoggingService.logTransactionFlagged(
      transactionId,
      transaction.user_id,
      flags,
      reason,
      requestMetadata
    );

    await TransactionLoggingService.logStatusChange(
      transactionId,
      Transaction.STATUS.COMPLETED,
      Transaction.STATUS.FLAGGED,
      transaction.user_id,
      `Flagged by admin: ${reason}`,
      requestMetadata
    );

    res.json({
      success: true,
      message: 'Transaction flagged successfully',
      data: {
        transactionId,
        status: Transaction.STATUS.FLAGGED,
        flags,
        reason,
        flaggedBy: adminUserId,
        flaggedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error flagging transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while flagging transaction'
    });
  }
});

export default router;
