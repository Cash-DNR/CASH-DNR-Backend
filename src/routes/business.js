import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Business } from '../models/index.js';
import { verifyIdWithHomeAffairs } from '../services/homeAffairs.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * @route   POST /api/register/business
 * @desc    Register a new business entity
 * @access  Public
 */
router.post('/register', [
  body('businessRegNumber')
    .matches(/^\d{4}\/\d{6}\/\d{2}$/)
    .withMessage('Invalid business registration number format (YYYY/NNNNNN/NN)'),
  body('representativeIdNumber')
    .isLength({ min: 13, max: 13 })
    .withMessage('South African ID number must be exactly 13 digits')
    .isNumeric()
    .withMessage('ID number must contain only numbers'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('contactInfo.phone')
    .matches(/^\+27\s\d{2}\s\d{3}\s\d{4}$/)
    .withMessage('Valid South African phone number required (format: +27 11 123 4567)')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { businessRegNumber, representativeIdNumber, contactInfo } = req.body;

    // Verify representative with Home Affairs
    const verificationResult = await verifyIdWithHomeAffairs(representativeIdNumber);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Representative ID verification failed',
        details: verificationResult.error
      });
    }

    // Generate business tax ID (TBD prefix for business)
    const taxId = `TBD-${businessRegNumber.replace(/\//g, '')}`;

    // Create business record
    const business = await Business.create({
      business_reg_number: businessRegNumber,
      representative_id_number: representativeIdNumber,
      tax_id: taxId,
      email: contactInfo.email,
      phone: contactInfo.phone,
      status: Business.STATUS.ACTIVE
    });

    logger.info(`✅ Business registered successfully: ${businessRegNumber}`);

    res.status(201).json({
      message: 'Business registered successfully',
      userId: business.id,
      taxId: business.tax_id,
      businessInfo: {
        registeredName: business.registered_name,
        tradingName: business.trading_name,
        userType: 'Business',
        status: business.status
      }
    });

  } catch (error) {
    logger.error('Business registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during business registration'
    });
  }
});

export default router;
