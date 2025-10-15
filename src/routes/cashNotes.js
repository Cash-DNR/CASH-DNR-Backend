/**
 * Cash Notes Routes - Phase 1 Foundational Operations
 * Handles all cash note related operations for digital cash management
 */

import express from 'express';
import CashNoteController from '../controllers/cashNoteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// Apply authentication and audit logging to all routes
router.use(authenticateToken);
router.use(auditLogger);

/**
 * @route   POST /api/cash-notes/register
 * @desc    Register a new cash note in the system
 * @access  Private
 * @body    {
 *   referenceCode: string,
 *   denomination: number,
 *   serialNumber?: string,
 *   scanMethod?: string,
 *   qrCodeData?: string,
 *   barcodeData?: string,
 *   isForeign?: boolean,
 *   foreignCurrency?: string,
 *   exchangeRate?: number
 * }
 */
router.post('/register', CashNoteController.registerCashNote);

/**
 * @route   POST /api/cash-notes/scan
 * @desc    Scan and verify a cash note
 * @access  Private
 * @body    {
 *   referenceCode: string,
 *   scanMethod?: string
 * }
 */
router.post('/scan', CashNoteController.scanCashNote);

/**
 * @route   GET /api/cash-notes/my-notes
 * @desc    Get user's cash notes
 * @access  Private
 * @query   {
 *   page?: number,
 *   limit?: number,
 *   status?: string,
 *   noteType?: string
 * }
 */
router.get('/my-notes', CashNoteController.getUserCashNotes);

/**
 * @route   POST /api/cash-notes/:id/transfer
 * @desc    Transfer ownership of a cash note
 * @access  Private
 * @params  id - Cash note ID
 * @body    {
 *   toUserId?: string,
 *   toUserPhone?: string,
 *   transferMethod?: string,
 *   isProxyTransaction?: boolean,
 *   proxyType?: string,
 *   proxyAuthorizationCode?: string,
 *   transactionContext?: string,
 *   notes?: string
 * }
 */
router.post('/:id/transfer', CashNoteController.transferOwnership);

/**
 * @route   PUT /api/cash-notes/:id/flag-stolen
 * @desc    Flag a cash note as stolen (Phase 1 fraud prevention)
 * @access  Private
 * @params  id - Cash note ID
 * @body    {
 *   reason?: string
 * }
 */
router.put('/:id/flag-stolen', CashNoteController.flagAsStolen);

/**
 * @route   GET /api/cash-notes/:id/transfer-history
 * @desc    Get transfer history for a cash note
 * @access  Private
 * @params  id - Cash note ID
 * @query   {
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/:id/transfer-history', CashNoteController.getTransferHistory);

/**
 * @route   POST /api/cash-notes/bulk-register
 * @desc    Register multiple cash notes (for businesses/bulk operations)
 * @access  Private
 * @body    {
 *   cashNotes: Array<{
 *     referenceCode: string,
 *     denomination: number,
 *     serialNumber?: string,
 *     scanMethod?: string
 *   }>
 * }
 */
router.post('/bulk-register', async (req, res) => {
  try {
    const { cashNotes } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(cashNotes) || cashNotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cash notes array is required'
      });
    }

    if (cashNotes.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 cash notes can be registered at once'
      });
    }

    const results = [];
    const errors = [];

    // Process each cash note
    for (let i = 0; i < cashNotes.length; i++) {
      const note = cashNotes[i];
      
      try {
        // Simulate individual registration
        const mockReq = { 
          body: { 
            ...note, 
            userId 
          }, 
          user: req.user,
          ip: req.ip,
          get: req.get.bind(req)
        };
        
        const mockRes = {
          status: (code) => mockRes,
          json: (data) => data
        };

        const result = await CashNoteController.registerCashNote(mockReq, mockRes);
        
        if (result.success) {
          results.push({
            index: i,
            referenceCode: note.referenceCode,
            success: true,
            data: result.data
          });
        } else {
          errors.push({
            index: i,
            referenceCode: note.referenceCode,
            error: result.message
          });
        }
        
      } catch (error) {
        errors.push({
          index: i,
          referenceCode: note.referenceCode,
          error: error.message
        });
      }
    }

    return res.json({
      success: true,
      message: `Processed ${cashNotes.length} cash notes`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: cashNotes.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Bulk registration failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cash-notes/proxy-authorize
 * @desc    Authorize a proxy transaction via USSD/digital confirmation (Phase 1)
 * @access  Private
 * @body    {
 *   proxyUserId: string,
 *   authorizationMethod: string,
 *   maxAmount?: number,
 *   validUntil?: string,
 *   purpose?: string
 * }
 */
router.post('/proxy-authorize', async (req, res) => {
  try {
    const { proxyUserId, authorizationMethod, maxAmount, validUntil, purpose } = req.body;
    const authorizingUserId = req.user?.id;

    if (!proxyUserId || !authorizationMethod) {
      return res.status(400).json({
        success: false,
        message: 'Proxy user ID and authorization method are required'
      });
    }

    // Generate authorization code
    const authorizationCode = `PXY-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
    
    // Set expiry (default 24 hours)
    const expiresAt = validUntil ? new Date(validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // In a real implementation, this would be stored in a ProxyAuthorization model
    // For Phase 1, we'll return the authorization details
    
    return res.json({
      success: true,
      message: 'Proxy authorization created successfully',
      data: {
        authorizationCode,
        proxyUserId,
        authorizingUserId,
        authorizationMethod,
        maxAmount: maxAmount || null,
        validUntil: expiresAt,
        purpose: purpose || 'General proxy spending',
        status: 'active'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create proxy authorization',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cash-notes/statistics
 * @desc    Get user's cash note statistics
 * @access  Private
 */
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { CashNote, CashNoteTransfer } = await import('../models/index.js');

    // Get user's cash note statistics
    const [
      totalNotes,
      totalValue,
      transfersSent,
      transfersReceived,
      flaggedNotes
    ] = await Promise.all([
      CashNote.count({ where: { current_owner_id: userId } }),
      CashNote.sum('denomination', { where: { current_owner_id: userId } }) || 0,
      CashNoteTransfer.count({ where: { from_user_id: userId, status: 'completed' } }),
      CashNoteTransfer.count({ where: { to_user_id: userId, status: 'completed' } }),
      CashNote.count({ where: { current_owner_id: userId, status: 'stolen' } })
    ]);

    // Get note type breakdown
    const notesByType = await CashNote.findAll({
      where: { current_owner_id: userId },
      attributes: [
        'note_type',
        [CashNote.sequelize.fn('COUNT', '*'), 'count'],
        [CashNote.sequelize.fn('SUM', CashNote.sequelize.col('denomination')), 'total_value']
      ],
      group: ['note_type'],
      raw: true
    });

    return res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        overview: {
          totalNotes,
          totalValue: parseFloat(totalValue).toFixed(2),
          transfersSent,
          transfersReceived,
          flaggedNotes
        },
        notesByType: notesByType.map(type => ({
          noteType: type.note_type,
          count: parseInt(type.count),
          totalValue: parseFloat(type.total_value || 0).toFixed(2)
        })),
        activity: {
          totalTransfers: transfersSent + transfersReceived,
          netTransfers: transfersReceived - transfersSent
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

export default router;
