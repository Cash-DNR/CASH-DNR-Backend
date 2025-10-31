/**
 * Cash Note Controller
 * Handles Phase 1 foundational operations for cash note management
 * - Scanning and registration of cash notes
 * - Ownership transfers and digital tracking
 * - Fraud prevention and validation
 */

import CashNote from '../models/CashNote.js';
import CashNoteTransfer from '../models/CashNoteTransfer.js';
import User from '../models/User.js';
import TransactionLoggingService from '../services/transactionLoggingService.js';
import logger from '../services/logger.js';

class CashNoteController {
  /**
   * Register a new cash note in the system
   * POST /api/cash-notes/register
   */
  static async registerCashNote(req, res) {
    try {
      const {
        referenceCode,
        denomination,
        serialNumber,
        scanMethod,
        qrCodeData,
        barcodeData,
        isForeign,
        foreignCurrency,
        exchangeRate
      } = req.body;

      const userId = req.user?.id;

      // Validate required fields
      if (!referenceCode || !denomination || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Reference code, denomination, and user ID are required'
        });
      }

      // Validate reference code format
      if (!CashNote.validateReferenceCode(referenceCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference code format'
        });
      }

      // Check if note already exists
      const existingNote = await CashNote.findOne({
        where: { reference_code: referenceCode }
      });

      if (existingNote) {
        return res.status(409).json({
          success: false,
          message: 'Cash note already registered',
          data: {
            referenceCode,
            currentOwner: existingNote.current_owner_id,
            status: existingNote.status
          }
        });
      }

      // Determine note type based on denomination
      const noteTypeMap = {
        10: CashNote.NOTE_TYPES.ZAR_10,
        20: CashNote.NOTE_TYPES.ZAR_20,
        50: CashNote.NOTE_TYPES.ZAR_50,
        100: CashNote.NOTE_TYPES.ZAR_100,
        200: CashNote.NOTE_TYPES.ZAR_200
      };

      const noteType = isForeign ? CashNote.NOTE_TYPES.FOREIGN : noteTypeMap[denomination];

      if (!noteType && !isForeign) {
        return res.status(400).json({
          success: false,
          message: 'Invalid denomination. Must be 10, 20, 50, 100, or 200'
        });
      }

      // Create cash note
      const cashNote = await CashNote.create({
        reference_code: referenceCode,
        denomination: parseFloat(denomination),
        note_type: noteType,
        serial_number: serialNumber,
        current_owner_id: userId,
        original_owner_id: userId,
        scan_method: scanMethod,
        qr_code_data: qrCodeData,
        barcode_data: barcodeData,
        is_foreign: isForeign || false,
        foreign_currency: foreignCurrency,
        exchange_rate: exchangeRate,
        verification_score: 0.95, // Default high score for properly formatted codes
        metadata: {
          registered_via: 'mobile_app',
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        }
      });

      // Log the registration
      await TransactionLoggingService.logCashNoteRegistered(cashNote, userId);

      logger.info(`Cash note registered: ${referenceCode} by user ${userId}`);

      return res.status(201).json({
        success: true,
        message: 'Cash note registered successfully',
        data: {
          id: cashNote.id,
          referenceCode: cashNote.reference_code,
          denomination: cashNote.denomination,
          noteType: cashNote.note_type,
          status: cashNote.status,
          currentOwner: userId,
          registeredAt: cashNote.created_at
        }
      });

    } catch (error) {
      logger.error('Cash note registration failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to register cash note',
        error: error.message
      });
    }
  }

  /**
   * Scan and verify a cash note
   * POST /api/cash-notes/scan
   */
  static async scanCashNote(req, res) {
    try {
      const { referenceCode, scanMethod } = req.body;
      const userId = req.user?.id;

      if (!referenceCode) {
        return res.status(400).json({
          success: false,
          message: 'Reference code is required'
        });
      }

      // Validate reference code format
      if (!CashNote.validateReferenceCode(referenceCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference code format'
        });
      }

      // Find the cash note
      const cashNote = await CashNote.findOne({
        where: { reference_code: referenceCode },
        include: [
          {
            model: User,
            as: 'currentOwner',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      if (!cashNote) {
        return res.status(404).json({
          success: false,
          message: 'Cash note not found',
          data: {
            referenceCode,
            suggestion: 'This note may not be registered in the system yet'
          }
        });
      }

      // Check if note is flagged or locked
      if (cashNote.status === CashNote.STATUS.STOLEN) {
        logger.warn(`Attempted scan of stolen note: ${referenceCode} by user ${userId}`);
        return res.status(403).json({
          success: false,
          message: 'This cash note has been reported as stolen',
          data: {
            referenceCode,
            status: cashNote.status,
            flaggedAt: cashNote.flagged_at
          }
        });
      }

      if (cashNote.is_locked) {
        return res.status(423).json({
          success: false,
          message: 'This cash note is temporarily locked',
          data: {
            referenceCode,
            lockedReason: cashNote.locked_reason,
            lockedAt: cashNote.locked_at
          }
        });
      }

      // Log the scan
      await TransactionLoggingService.logCashNoteScanned(cashNote, userId, scanMethod);

      return res.json({
        success: true,
        message: 'Cash note scanned successfully',
        data: {
          id: cashNote.id,
          referenceCode: cashNote.reference_code,
          denomination: cashNote.denomination,
          noteType: cashNote.note_type,
          status: cashNote.status,
          currentOwner: cashNote.currentOwner,
          transferCount: cashNote.transfer_count,
          isOwnedByScanner: cashNote.current_owner_id === userId,
          canTransfer: cashNote.canBeTransferred(),
          metadata: {
            issueDate: cashNote.issued_at,
            lastTransfer: cashNote.last_transferred_at,
            isForeign: cashNote.is_foreign,
            foreignCurrency: cashNote.foreign_currency
          }
        }
      });

    } catch (error) {
      logger.error('Cash note scan failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to scan cash note',
        error: error.message
      });
    }
  }

  /**
   * Transfer ownership of a cash note
   * POST /api/cash-notes/:id/transfer
   */
  static async transferOwnership(req, res) {
    try {
      const { id: cashNoteId } = req.params;
      const {
        toUserId,
        toUserPhone,
        transferMethod,
        isProxyTransaction,
        proxyType,
        proxyAuthorizationCode,
        transactionContext,
        notes
      } = req.body;

      const fromUserId = req.user?.id;

      // Validate required fields
      if (!toUserId && !toUserPhone) {
        return res.status(400).json({
          success: false,
          message: 'Recipient user ID or phone number is required'
        });
      }

      // Find the cash note
      const cashNote = await CashNote.findByPk(cashNoteId);
      if (!cashNote) {
        return res.status(404).json({
          success: false,
          message: 'Cash note not found'
        });
      }

      // Verify ownership
      if (cashNote.current_owner_id !== fromUserId && !isProxyTransaction) {
        return res.status(403).json({
          success: false,
          message: 'You are not the current owner of this cash note'
        });
      }

      // Check if note can be transferred
      if (!cashNote.canBeTransferred()) {
        return res.status(423).json({
          success: false,
          message: 'This cash note cannot be transferred at this time',
          data: {
            status: cashNote.status,
            isLocked: cashNote.is_locked,
            lockedReason: cashNote.locked_reason
          }
        });
      }

      // Find recipient user
      let recipientUser;
      if (toUserId) {
        recipientUser = await User.findByPk(toUserId);
      } else if (toUserPhone) {
        recipientUser = await User.findOne({
          where: { phone_number: toUserPhone }
        });
      }

      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message: 'Recipient user not found'
        });
      }

      // Handle foreign currency validation
      if (cashNote.is_foreign) {
        // For Phase 1, foreign transfers require Home Affairs validation
        const homeAffairsValidation = await this.validateForeignTransfer(cashNote, fromUserId, recipientUser.id);

        if (!homeAffairsValidation.success) {
          return res.status(403).json({
            success: false,
            message: 'Home Affairs validation required for foreign currency transfers',
            data: homeAffairsValidation
          });
        }
      }

      // Create transfer record
      const transfer = await CashNoteTransfer.create({
        cash_note_id: cashNote.id,
        from_user_id: fromUserId,
        to_user_id: recipientUser.id,
        transfer_method: transferMethod || CashNoteTransfer.TRANSFER_METHODS.DIGITAL_CONFIRM,
        amount: cashNote.denomination,
        is_proxy_transaction: isProxyTransaction || false,
        proxy_type: proxyType,
        proxy_authorization_code: proxyAuthorizationCode,
        transaction_context: transactionContext || 'p2p',
        ip_address: req.ip,
        device_fingerprint: req.get('User-Agent'),
        verification_method: 'digital_signature', // Assume app-based verification
        notes,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        metadata: {
          initiated_via: 'mobile_app',
          user_agent: req.get('User-Agent')
        }
      });

      // Update cash note ownership
      cashNote.current_owner_id = recipientUser.id;
      cashNote.last_transferred_at = new Date();
      cashNote.transfer_count += 1;
      await cashNote.save();

      // Complete the transfer
      await transfer.complete();

      // Log the transfer
      await TransactionLoggingService.logCashNoteTransferred(transfer);

      logger.info(`Cash note ${cashNote.reference_code} transferred from ${fromUserId} to ${recipientUser.id}`);

      return res.json({
        success: true,
        message: 'Cash note ownership transferred successfully',
        data: {
          transferId: transfer.id,
          transferReference: transfer.transfer_reference,
          cashNote: {
            id: cashNote.id,
            referenceCode: cashNote.reference_code,
            denomination: cashNote.denomination
          },
          from: {
            id: fromUserId,
            username: req.user.username
          },
          to: {
            id: recipientUser.id,
            username: recipientUser.username,
            name: `${recipientUser.first_name} ${recipientUser.last_name}`
          },
          transferredAt: transfer.completed_at,
          newTransferCount: cashNote.transfer_count
        }
      });

    } catch (error) {
      logger.error('Cash note transfer failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to transfer cash note ownership',
        error: error.message
      });
    }
  }

  /**
   * Get user's cash notes
   * GET /api/cash-notes/my-notes
   */
  static async getUserCashNotes(req, res) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 50, status, noteType } = req.query;

      const whereClause = { current_owner_id: userId };

      if (status) {
        whereClause.status = status;
      }

      if (noteType) {
        whereClause.note_type = noteType;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: cashNotes } = await CashNote.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'originalOwner',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      // Calculate total value
      const totalValue = cashNotes.reduce((sum, note) => sum + parseFloat(note.denomination), 0);

      return res.json({
        success: true,
        message: 'Cash notes retrieved successfully',
        data: {
          cashNotes: cashNotes.map(note => ({
            id: note.id,
            referenceCode: note.reference_code,
            denomination: note.denomination,
            noteType: note.note_type,
            status: note.status,
            transferCount: note.transfer_count,
            registeredAt: note.issued_at,
            lastTransferAt: note.last_transferred_at,
            originalOwner: note.originalOwner,
            isForeign: note.is_foreign,
            foreignCurrency: note.foreign_currency
          })),
          pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            limit: parseInt(limit)
          },
          summary: {
            totalNotes: count,
            totalValue: totalValue.toFixed(2),
            currency: 'ZAR'
          }
        }
      });

    } catch (error) {
      logger.error('Failed to retrieve user cash notes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve cash notes',
        error: error.message
      });
    }
  }

  /**
   * Flag a cash note as stolen
   * PUT /api/cash-notes/:id/flag-stolen
   */
  static async flagAsStolen(req, res) {
    try {
      const { id: cashNoteId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const cashNote = await CashNote.findByPk(cashNoteId);
      if (!cashNote) {
        return res.status(404).json({
          success: false,
          message: 'Cash note not found'
        });
      }

      // Verify ownership or admin privileges
      if (cashNote.current_owner_id !== userId && !req.user.is_admin) {
        return res.status(403).json({
          success: false,
          message: 'You can only flag your own cash notes as stolen'
        });
      }

      // Flag as stolen
      await cashNote.flagAsStolen(userId, reason || 'Reported as stolen by owner');

      logger.warn(`Cash note flagged as stolen: ${cashNote.reference_code} by user ${userId}`);

      return res.json({
        success: true,
        message: 'Cash note flagged as stolen successfully',
        data: {
          referenceCode: cashNote.reference_code,
          status: cashNote.status,
          flaggedAt: cashNote.flagged_at,
          flaggedBy: userId
        }
      });

    } catch (error) {
      logger.error('Failed to flag cash note as stolen:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to flag cash note as stolen',
        error: error.message
      });
    }
  }

  /**
   * Get transfer history for a cash note
   * GET /api/cash-notes/:id/transfer-history
   */
  static async getTransferHistory(req, res) {
    try {
      const { id: cashNoteId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const cashNote = await CashNote.findByPk(cashNoteId);
      if (!cashNote) {
        return res.status(404).json({
          success: false,
          message: 'Cash note not found'
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: transfers } = await CashNoteTransfer.findAndCountAll({
        where: { cash_note_id: cashNoteId },
        limit: parseInt(limit),
        offset: offset,
        order: [['initiated_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'fromUser',
            attributes: ['id', 'username', 'first_name', 'last_name']
          },
          {
            model: User,
            as: 'toUser',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      return res.json({
        success: true,
        message: 'Transfer history retrieved successfully',
        data: {
          cashNote: {
            id: cashNote.id,
            referenceCode: cashNote.reference_code,
            denomination: cashNote.denomination,
            totalTransfers: cashNote.transfer_count
          },
          transfers: transfers.map(transfer => ({
            id: transfer.id,
            transferReference: transfer.transfer_reference,
            from: transfer.fromUser,
            to: transfer.toUser,
            amount: transfer.amount,
            status: transfer.status,
            transferMethod: transfer.transfer_method,
            isProxyTransaction: transfer.is_proxy_transaction,
            initiatedAt: transfer.initiated_at,
            completedAt: transfer.completed_at
          })),
          pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to retrieve transfer history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transfer history',
        error: error.message
      });
    }
  }

  /**
   * Validate foreign currency transfer with Home Affairs
   * Private helper method for Phase 1 foreign currency handling
   */
  static async validateForeignTransfer(cashNote, fromUserId, toUserId) {
    try {
      // Import Home Affairs service
      const { homeAffairsService } = await import('../services/homeAffairsService.js');

      // Get user details for validation
      const [fromUser, toUser] = await Promise.all([
        User.findByPk(fromUserId),
        User.findByPk(toUserId)
      ]);

      // Validate both users with Home Affairs
      const validationResult = await homeAffairsService.validateForeignCurrencyTransfer({
        fromUser: {
          idNumber: fromUser.id_number,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name
        },
        toUser: {
          idNumber: toUser.id_number,
          firstName: toUser.first_name,
          lastName: toUser.last_name
        },
        cashNote: {
          referenceCode: cashNote.reference_code,
          foreignCurrency: cashNote.foreign_currency,
          amount: cashNote.denomination,
          exchangeRate: cashNote.exchange_rate
        }
      });

      return validationResult;

    } catch (error) {
      logger.error('Foreign transfer validation failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Home Affairs validation service unavailable'
      };
    }
  }
}

export default CashNoteController;
