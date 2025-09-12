import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Transaction, User } from '../models/index.js';
import logger from '../services/logger.js';

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

    // Create transaction
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
      status: Transaction.STATUS.COMPLETED
    });

    logger.info(`✅ Transaction created: ${reference}`);

    res.status(201).json({
      message: 'Transaction logged successfully',
      transaction: {
        reference: transaction.reference,
        amount: transaction.amount,
        purpose: transaction.purpose,
        taxClassification: transaction.tax_classification,
        timestamp: transaction.created_at,
        status: transaction.status
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

export default router;
