/* eslint-disable no-unused-vars */
/* eslint-disable space-before-function-paren */
/* eslint-disable no-trailing-spaces */
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { verifyIdWithHomeAffairs } from '../services/homeAffairs.js';
import { sarsComplianceChecker, generateTaxNumber } from '../services/SARS.js';
import TaxNumberGenerationService from '../services/taxNumberGenerationService.js';
import logger from '../services/logger.js';
import { upload as registrationUpload } from '../controllers/fileController.js';
import File from '../models/File.js';

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP via SMS (mock implementation)
const sendOTP = async (phoneNumber, otp) => {
  // In production, integrate with SMS service like Twilio, AWS SNS, etc.
  console.log(`📱 Sending OTP ${otp} to ${phoneNumber}`);
  // Mock successful send
  return { success: true, message: 'OTP sent successfully' };
};

// Function to extract date of birth from South African ID number
const extractDateOfBirth = (idNumber) => {
  const year = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);
  
  // Determine the century (19 or 20)
  const currentYear = new Date().getFullYear() % 100;
  const century = parseInt(year) <= currentYear ? '20' : '19';
  
  // Create date string in ISO format
  const dateStr = `${century}${year}-${month}-${day}`;
  return new Date(dateStr).toISOString().split('T')[0];
};

const router = express.Router();

// File upload validation middleware
function validateFileUpload(req, res, next) {
    try {
        console.log('\n🔍 Detailed Request Debug:');
        console.log('1. Request Method:', req.method);
        console.log('2. Request URL:', req.url);
        console.log('3. Content-Type:', req.headers['content-type']);
        console.log('4. Request Body:', req.body);
        console.log('5. Request Files:', req.files);
        
        // Check content type
        if (!req.headers['content-type']?.includes('multipart/form-data')) {
            return res.status(400).json({
                error: 'Invalid content type',
                expected: 'multipart/form-data',
                received: req.headers['content-type']
            });
        }

        // Check file upload middleware
        if (!req.files) {
            return res.status(500).json({
                error: 'File upload middleware not properly initialized',
                debug: {
                    contentType: req.headers['content-type'],
                    bodyKeys: Object.keys(req.body)
                }
            });
        }

        // Check if any files were actually uploaded
        if (Object.keys(req.files).length === 0) {
            return res.status(400).json({
                error: 'No files were uploaded',
                debug: {
                    contentType: req.headers['content-type'],
                    bodyKeys: Object.keys(req.body),
                    files: req.files
                }
            });
        }

        // Check required files
        const { idDocument, proofOfResidence } = req.files || {};
        if (!idDocument || !proofOfResidence) {
            return res.status(400).json({
                error: 'Missing required files',
                debug: {
                    idDocument: !!idDocument,
                    proofOfResidence: !!proofOfResidence
                }
            });
        }

        // Validate file types and sizes
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(idDocument.mimetype)) {
            return res.status(400).json({
                error: 'Invalid ID document format',
                allowedTypes
            });
        }

        if (!allowedTypes.includes(proofOfResidence.mimetype)) {
            return res.status(400).json({
                error: 'Invalid proof of residence format',
                allowedTypes
            });
        }

        if (idDocument.size > maxSize || proofOfResidence.size > maxSize) {
            return res.status(400).json({
                error: 'File size too large',
                maxSize: '5MB'
            });
        }

        console.log('📁 Files validated successfully');
        next();
    } catch (error) {
        console.error('Error in file validation:', error);
        return res.status(500).json({
            error: 'Error validating files',
            message: error.message
        });
    }
}

// Validation chain for ID number
const validateIdNumber = [
    body('idNumber')
        .isLength({ min: 13, max: 13 })
        .withMessage('South African ID number must be exactly 13 digits')
        .isNumeric()
        .withMessage('ID number must contain only numbers')
];

/**
 * @route   POST /api/citizen
 * @desc    Register a new citizen
 * @access  Public
 */
router.post('/citizen', async (req, res) => {
    try {
        console.log('\n🔍 Request received:', {
            method: req.method,
            contentType: req.headers['content-type'],
            body: req.body
        });

        // Validate request content type
        if (req.headers['content-type'] !== 'application/json') {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type',
                message: 'Request must be application/json'
            });
        }

        // Extract fields from request body
        const {
            idNumber,
            contactInfo,
            homeAddress,
            password
        } = req.body;

        // Validate required fields
        const missingFields = [];
        
        if (!idNumber) missingFields.push('idNumber');
        if (!contactInfo?.email) missingFields.push('contactInfo.email');
        if (!contactInfo?.phone) missingFields.push('contactInfo.phone');
        if (!homeAddress?.streetAddress) missingFields.push('homeAddress.streetAddress');
        if (!homeAddress?.town) missingFields.push('homeAddress.town');
        if (!homeAddress?.city) missingFields.push('homeAddress.city');
        if (!homeAddress?.province) missingFields.push('homeAddress.province');
        if (!homeAddress?.postalCode) missingFields.push('homeAddress.postalCode');
        if (!password) missingFields.push('password');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                missingFields,
                debug: {
                    receivedFields: Object.keys(req.body),
                    contentType: req.headers['content-type']
                }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { id_number: idNumber },
                    { email: contactInfo.email }
                ]
            }
        });
        // Continue with registration

    } catch (error) {
        console.error('Error in /citizen route:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { idNumber, contactInfo, homeAddress } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { id_number: idNumber },
          { email: contactInfo.email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already registered',
        details: existingUser.email === contactInfo.email ? 
          'Email already in use' : 'ID number already registered'
      });
    }

    // Verify with Home Affairs
    const verificationResult = await verifyIdWithHomeAffairs(idNumber);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        details: verificationResult.details || 'ID verification failed'
      });
    }

    // Generate tax number if needed
    const taxNumber = generateTaxNumber(idNumber);

    // Hash password
    const password_hash = await bcrypt.hash(req.body.password, 10);

    // Generate username if not provided
    const username = req.body.username || `user_${Date.now()}`;

    // Extract date of birth from ID number
    const dateOfBirth = extractDateOfBirth(idNumber);

    // Create new user
    const user = await User.create({
      id_number: idNumber,
      username,
      email: contactInfo.email,
      phone_number: contactInfo.phone || null,
      password_hash,
      first_name: verificationResult.citizen.firstName,
      last_name: verificationResult.citizen.lastName,
      date_of_birth: dateOfBirth,
      tax_number: taxNumber,
      home_address: homeAddress,

      status: User.STATUS.PENDING_VERIFICATION,
      home_affairs_verified: true,
      is_active: true,
      is_verified: false
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        idNumber: user.idNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: user.fullName,
          idNumber: user.id_number,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          phoneNumber: user.phone_number,
          taxNumber: user.tax_number,
          homeAffairsVerified: user.home_affairs_verified,
          isActive: user.is_active,
          isVerified: user.is_verified,
          status: user.status,
          userType: 'Individual'
        },
        token,
        registrationComplete: !!user.phone_number,
        missingInfo: {
          phoneNumber: !user.phone_number
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @route   POST /api/auth/verify-id
 * @desc    Verify South African ID with Home Affairs
 * @access  Public
 */
router.post('/verify-id', [
  body('idNumber')
    .isLength({ min: 13, max: 13 })
    .withMessage('South African ID number must be exactly 13 digits')
    .isNumeric()
    .withMessage('ID number must contain only numbers')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { idNumber } = req.body;

    logger.info(`🔍 ID verification request for: ${idNumber}`);

    // Verify with Home Affairs
    const verificationResult = await verifyIdWithHomeAffairs(idNumber);

    // Check if ID is already registered
    const existingUser = await User.findOne({ where: { id_number: idNumber } });
    
    res.json({
      success: verificationResult.success,
      message: verificationResult.message,
      data: {
        idNumber,
        isValid: verificationResult.success,
        isRegistered: !!existingUser,
        homeAffairsData: verificationResult.data,
        extractedInfo: verificationResult.extractedInfo,
        validationDetails: verificationResult.validationDetails,
        fallbackUsed: verificationResult.fallbackUsed || false
      }
    });

  } catch (error) {
    logger.error('ID verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during ID verification'
    });
  }
});

/**
 * Main registration - requires ID number and contact information
 * Personal details are fetched from Home Affairs API
 */
router.post('/register', [
  body('idNumber')
    .isLength({ min: 13, max: 13 })
    .withMessage('South African ID number must be exactly 13 digits')
    .isNumeric()
    .withMessage('ID number must contain only numbers'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .matches(/^\+27\s\d{2}\s\d{3}\s\d{4}$/)
    .withMessage('Valid South African phone number required (format: +27 82 123 4567)'),
  body('homeAddress')
    .optional()
    .custom((value) => {
      if (value) {
        if (typeof value !== 'object') {
          throw new Error('Home address must be an object');
        }
        const requiredFields = ['streetAddress', 'town', 'city', 'province', 'postalCode'];
        const missingFields = requiredFields.filter(field => !value[field] || value[field].trim() === '');
        if (missingFields.length > 0) {
          throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
        }
        // Validate field lengths
        if (value.streetAddress.length > 100) throw new Error('Street address must be less than 100 characters');
        if (value.town.length > 50) throw new Error('Town must be less than 50 characters');
        if (value.city.length > 50) throw new Error('City must be less than 50 characters');
        if (value.province.length > 50) throw new Error('Province must be less than 50 characters');
        if (value.postalCode.length > 10) throw new Error('Postal code must be less than 10 characters');
      }
      return true;
    }),
  body('phoneNumber')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { contactInfo, idNumber, homeAddress, phoneNumber } = req.body;
    const { email, phone } = contactInfo || {};

    logger.info(`🔍 Starting registration for ID: ${idNumber}`);
    logger.info(`🔍 Debug - contactInfo: ${JSON.stringify(contactInfo)}`);
    logger.info(`🔍 Debug - email: ${email}, phone: ${phone}`);

    // Check if email is already registered
    const existingEmailUser = await User.findOne({ where: { email } });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    // Check if ID number is already registered
    const existingIdUser = await User.findOne({ where: { id_number: idNumber } });
    if (existingIdUser) {
      return res.status(400).json({
        success: false,
        message: 'This ID number is already registered'
      });
    }

    // Verify ID with Home Affairs API and fetch personal details
    logger.info(`🔍 Verifying ID number with Home Affairs API: ${idNumber}`);
    const idVerificationResult = await verifyIdWithHomeAffairs(idNumber);
    
    console.log('🔍 Verification result:', JSON.stringify(idVerificationResult, null, 2));
    
    if (!idVerificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'ID number not found in Home Affairs database',
        details: idVerificationResult.message,
        validationDetails: idVerificationResult.validationDetails
      });
    }

    // Extract personal details from Home Affairs data
    const homeAffairsData = idVerificationResult.data?.homeAffairsData;
    console.log('🔍 Home Affairs data extracted:', JSON.stringify(homeAffairsData, null, 2));
    if (!homeAffairsData || !homeAffairsData.firstName || !homeAffairsData.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Unable to retrieve complete personal details from Home Affairs',
        debug: {
          hasData: !!idVerificationResult.data,
          hasHomeAffairsData: !!homeAffairsData,
          dataKeys: idVerificationResult.data ? Object.keys(idVerificationResult.data) : [],
          homeAffairsDataKeys: homeAffairsData ? Object.keys(homeAffairsData) : []
        }
      });
    }

    logger.info(`✅ Home Affairs verification successful for: ${homeAffairsData.firstName} ${homeAffairsData.lastName}`);

    // Generate username from first name and last name
    const baseUsername = `${homeAffairsData.firstName.toLowerCase()}.${homeAffairsData.lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
    
    // Ensure username is unique
    while (await User.findOne({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Phase 1: Automatic Tax Number Generation
    logger.info(`🔢 Phase 1: Starting tax number generation for user: ${homeAffairsData.firstName} ${homeAffairsData.lastName}`);
    
    const taxGenerationResult = await TaxNumberGenerationService.generateForUser({
      id_number: idNumber,
      first_name: homeAffairsData.firstName,
      last_name: homeAffairsData.lastName,
      date_of_birth: homeAffairsData.dateOfBirth
    });

    let taxNumber;
    let taxNumberSource = 'none';
    
    if (taxGenerationResult.success) {
      taxNumber = taxGenerationResult.taxNumber;
      taxNumberSource = taxGenerationResult.isExisting ? 'existing_sars' : 'generated';
      logger.info(`✅ Tax number ${taxNumberSource}: ${taxNumber}`);
    } else {
      // Fallback to existing tax number from Home Affairs or generate basic one
      taxNumber = homeAffairsData.taxNumber || homeAffairsData.taxId || generateTaxNumber(idNumber);
      taxNumberSource = 'fallback';
      logger.warn(`⚠️ Tax generation service failed, using fallback: ${taxNumber}`);
    }

    // Phase 1: Create user with Home Affairs data and Phase 1 initialization
    const newUser = await User.create({
      username,
      email,
      password_hash: passwordHash,
      first_name: homeAffairsData.firstName,
      last_name: homeAffairsData.lastName,
      id_number: idNumber,
      date_of_birth: homeAffairsData.dateOfBirth,
      gender: homeAffairsData.gender,
      tax_number: taxNumber,
      home_address: homeAddress || null,
      phone_number: phoneNumber || null,
      home_affairs_verified: true,
      is_verified: false,
      is_active: true,
      // Phase 1 specific fields
      registration_phase: 'phase_1_complete',
      cash_notes_enabled: true,
      digital_wallet_enabled: true,
      phase_1_completed_at: new Date()
    });

    // Phase 1: Log successful registration with audit trail
    const { transactionLoggingService } = await import('../services/transactionLoggingService.js');
    await transactionLoggingService.logUserRegistration(newUser, {
      phase: 'phase_1',
      homeAffairsVerified: true,
      taxNumberGenerated: taxNumberSource !== 'existing_sars',
      taxNumberSource,
      registrationMethod: 'web_app'
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        username: newUser.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Include SARS compliance data in the response
    const sarsData = req.sarsData;

    res.status(201).json({
      success: true,
      message: 'User registered successfully with Home Affairs and SARS verification',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          idNumber: newUser.id_number,
          dateOfBirth: newUser.date_of_birth,
          gender: newUser.gender,
          homeAffairsVerified: newUser.home_affairs_verified,
          isActive: newUser.is_active,
          isVerified: newUser.is_verified
        },
        token,
        registrationComplete: !needsAdditionalInfo,
        missingInfo: {
          homeAddress: !homeAddress,
          phoneNumber: !phoneNumber
        },
        // Phase 1 Registration Data
        phase1Registration: {
          completed: true,
          taxNumberGenerated: taxNumberSource === 'generated',
          taxNumberSource,
          homeAffairsVerified: true,
          cashNotesEnabled: true,
          digitalWalletEnabled: true,
          nextSteps: [
            'Complete profile information',
            'Upload required documents',
            'Start scanning cash notes',
            'Set up digital wallet preferences'
          ]
        },
        taxInformation: {
          taxNumber,
          source: taxNumberSource,
          sarsRegistered: taxGenerationResult.success && !taxGenerationResult.isExisting,
          message: taxGenerationResult.message || 'Tax number ready for use'
        },
        homeAffairsVerification: {
          verified: true,
          source: 'home-affairs-api',
          personalDetails: {
            firstName: homeAffairsData.firstName,
            lastName: homeAffairsData.lastName,
            dateOfBirth: homeAffairsData.dateOfBirth,
            gender: homeAffairsData.gender,
            citizenship: homeAffairsData.citizenship,
            maritalStatus: homeAffairsData.maritalStatus,
            taxNumber: taxNumber
          }
        },
        sarsVerification: {
          taxReferenceNumber: sarsData.taxReferenceNumber,
          taxComplianceStatus: sarsData.taxComplianceStatus,
          lastSubmissionDate: sarsData.lastSubmissionDate,
          outstandingReturns: sarsData.outstandingReturns
        }
      }
    });

  } catch (error) {
    logger.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/auth/complete-profile
 * @desc    Complete user profile with home address and phone number
 * @access  Private (requires JWT token)
 */
router.put('/complete-profile', [
  body('homeAddress')
    .custom((value) => {
      if (typeof value !== 'object') {
        throw new Error('Home address must be an object');
      }
      const requiredFields = ['streetAddress', 'town', 'city', 'province', 'postalCode'];
      const missingFields = requiredFields.filter(field => !value[field] || value[field].trim() === '');
      if (missingFields.length > 0) {
        throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
      }
      // Validate field lengths
      if (value.streetAddress.length > 100) throw new Error('Street address must be less than 100 characters');
      if (value.town.length > 50) throw new Error('Town must be less than 50 characters');
      if (value.city.length > 50) throw new Error('City must be less than 50 characters');
      if (value.province.length > 50) throw new Error('Province must be less than 50 characters');
      if (value.postalCode.length > 10) throw new Error('Postal code must be less than 10 characters');
      return true;
    }),
  body('phoneNumber')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { homeAddress, phoneNumber } = req.body;
    
    // Extract user ID from JWT token (you'll need to add auth middleware)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Find and update user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user profile
    await user.update({
      home_address: homeAddress,
      phone_number: phoneNumber
    });

    console.log(`✅ Profile completed for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          idNumber: user.id_number,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          taxNumber: user.tax_number,
          homeAddress: user.home_address,
          phoneNumber: user.phone_number,
          homeAffairsVerified: user.home_affairs_verified,
          isActive: user.is_active,
          isVerified: user.is_verified
        }
      }
    });

  } catch (error) {
    console.error('❌ Profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile completion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test route for file uploads
router.post('/test-upload', async (req, res) => {
    try {
        console.log('\n🔍 Test Upload Debug:');
        console.log('Headers:', req.headers);
        console.log('Files:', req.files);
        console.log('Body:', req.body);

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded',
                debug: {
                    contentType: req.headers['content-type'],
                    hasFiles: !!req.files,
                    body: req.body
                }
            });
        }

        // Log each file received
        Object.keys(req.files).forEach(key => {
            const file = req.files[key];
            console.log(`File ${key}:`, {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype,
                tempFilePath: file.tempFilePath
            });
        });

        res.status(200).json({
            success: true,
            message: 'Files received successfully',
            files: Object.keys(req.files).map(key => ({
                fieldName: key,
                originalName: req.files[key].name,
                size: req.files[key].size,
                mimetype: req.files[key].mimetype
            })),
            body: req.body
        });
    } catch (error) {
        console.error('Test upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file upload',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/register-with-documents
 * @desc    Register user and upload required documents in one step (no token required)
 * @access  Public (multipart/form-data)
 */
router.post(
  '/register-with-documents',
  registrationUpload.fields([
    { name: 'id_document', maxCount: 5 },
    { name: 'proof_of_residence', maxCount: 5 },
    { name: 'bank_statement', maxCount: 5 },
    { name: 'other_documents', maxCount: 20 }
  ]),
  async (req, res) => {
    try {
      // Validate required text fields
      const {
        email,
        password,
        idNumber,
        phoneNumber
      } = req.body;

      let homeAddress = req.body.homeAddress;
      if (typeof homeAddress === 'string') {
        try {
          homeAddress = JSON.parse(homeAddress);
        } catch (_) {
          return res.status(400).json({ success: false, message: 'homeAddress must be JSON' });
        }
      }

      const missing = [];
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (!idNumber) missing.push('idNumber');
      if (missing.length) {
        return res.status(400).json({ success: false, message: 'Missing required fields', missing });
      }

      // Ensure mandatory documents are present
      const files = req.files || {};
      if (!files.id_document || !files.proof_of_residence) {
        return res.status(400).json({
          success: false,
          message: 'id_document and proof_of_residence are required'
        });
      }

      // Check duplicates
      const existingEmailUser = await User.findOne({ where: { email } });
      if (existingEmailUser) {
        return res.status(400).json({ success: false, message: 'This email is already registered' });
      }
      const existingIdUser = await User.findOne({ where: { id_number: idNumber } });
      if (existingIdUser) {
        return res.status(400).json({ success: false, message: 'This ID number is already registered' });
      }

      // Verify ID with Home Affairs
      const idVerificationResult = await verifyIdWithHomeAffairs(idNumber);
      if (!idVerificationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'ID verification failed',
          details: idVerificationResult.message
        });
      }

      const homeAffairsData = idVerificationResult.data?.homeAffairsData;
      if (!homeAffairsData || !homeAffairsData.firstName || !homeAffairsData.lastName) {
        return res.status(400).json({ success: false, message: 'Incomplete personal details from Home Affairs' });
      }

      // Build unique username
      const baseUsername = `${homeAffairsData.firstName.toLowerCase()}.${homeAffairsData.lastName.toLowerCase()}`;
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Password hash
      const passwordHash = await bcrypt.hash(password, 12);

      // Tax number
      let taxNumber = homeAffairsData.taxNumber || homeAffairsData.taxId;
      if (!taxNumber) taxNumber = generateTaxNumber(idNumber);

      // Create user first
      const newUser = await User.create({
        username,
        email,
        password_hash: passwordHash,
        first_name: homeAffairsData.firstName,
        last_name: homeAffairsData.lastName,
        id_number: idNumber,
        date_of_birth: homeAffairsData.dateOfBirth,
        gender: homeAffairsData.gender,
        tax_number: taxNumber,
        home_address: homeAddress || null,
        phone_number: phoneNumber || null,
        home_affairs_verified: true,
        is_verified: false,
        is_active: true
      });

      // Persist uploaded files to DB linked to new user
      const mapCategory = (fieldname) => {
        const mapping = {
          id_document: 'id_documents',
          id_documents: 'id_documents',
          proof_of_residence: 'proof_of_address',
          proof_of_address: 'proof_of_address',
          bank_statement: 'bank_statements',
          bank_statements: 'bank_statements',
          other_documents: 'other'
        };
        return mapping[fieldname] || 'other';
      };

      const created = [];
      const allFiles = Object.values(files).flat();
      for (const f of allFiles) {
        const rec = await File.create({
          original_name: f.originalname,
          file_name: f.filename,
          file_path: f.path,
          mime_type: f.mimetype,
          file_size: f.size,
          file_category: mapCategory(f.fieldname),
          user_id: newUser.id,
          upload_status: 'completed',
          metadata: {
            uploadedAt: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            fieldname: f.fieldname
          }
        });
        created.push({ id: rec.id, originalName: rec.original_name, fileName: rec.file_name, category: rec.file_category });
      }

      // Determine if required docs provided to mark as verified
      const requiredCategories = ['id_documents', 'proof_of_address', 'bank_statements'];
      const present = new Set(created.map(c => c.category));
      if (requiredCategories.every(c => present.has(c))) {
        newUser.is_verified = true;
        await newUser.save();
      }

      // Respond without issuing a token
      return res.status(201).json({
        success: true,
        message: 'User registered and documents uploaded',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            idNumber: newUser.id_number,
            dateOfBirth: newUser.date_of_birth,
            gender: newUser.gender,
            taxNumber: newUser.tax_number,
            homeAffairsVerified: newUser.home_affairs_verified,
            isActive: newUser.is_active,
            isVerified: newUser.is_verified
          },
          uploaded: created
        }
      });
    } catch (error) {
      logger.error('Register-with-documents error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during registration with documents' });
    }
  }
);

/**
 * @route   POST /api/auth/login/check-email
 * @desc    Check if email exists in database
 * @access  Public
 */
router.post('/login/check-email', [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    logger.info(`🔍 Checking email existence: ${email}`);

    // Check if user exists with this email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    res.json({
      success: true,
      message: 'Email found',
      data: {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountType: user.business_registration_number ? 'business' : 'individual'
      }
    });

  } catch (error) {
    logger.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
});

/**
 * @route   POST /api/auth/login/verify-credentials
 * @desc    Verify ID/Business number and password, then send OTP
 * @access  Public
 */
router.post('/login/verify-credentials', [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('identifier')
    .notEmpty()
    .withMessage('ID number or Business registration number is required')
    .custom((value) => {
      // Check if it's a 13-digit ID number or business registration format
      if (/^\d{13}$/.test(value)) {
        return true; // Valid SA ID number
      }
      if (/^\d{10}\/\d{2}\/\d{2}$/.test(value) || /^\d{4}\/\d{6}\/\d{2}$/.test(value)) {
        return true; // Valid business registration number
      }
      throw new Error('Must be a valid 13-digit ID number or business registration number');
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, identifier, password } = req.body;

    logger.info(`🔍 Verifying credentials for email: ${email}`);

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    // Check identifier (ID number or business registration)
    const isIdNumber = /^\d{13}$/.test(identifier);
    const isBusinessNumber = /^\d{10}\/\d{2}\/\d{2}$/.test(identifier) || /^\d{4}\/\d{6}\/\d{2}$/.test(identifier);

    let identifierMatch = false;
    if (isIdNumber && user.id_number === identifier) {
      identifierMatch = true;
    } else if (isBusinessNumber && user.business_registration_number === identifier) {
      identifierMatch = true;
    }

    if (!identifierMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID number or business registration number',
        code: 'INVALID_IDENTIFIER'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Check if user has a phone number for OTP
    if (!user.phone_number) {
      return res.status(400).json({
        success: false,
        message: 'No phone number associated with this account. Please contact support.',
        code: 'NO_PHONE_NUMBER'
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const otpKey = `${user.id}_${Date.now()}`;
    const otpExpiry = Date.now() + (60 * 1000); // 60 seconds

    otpStorage.set(otpKey, {
      userId: user.id,
      otp,
      email: user.email,
      expiresAt: otpExpiry,
      attempts: 0
    });

    // Send OTP to user's phone
    const smsResult = await sendOTP(user.phone_number, otp);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        code: 'OTP_SEND_FAILED'
      });
    }

    logger.info(`✅ OTP sent to ${user.phone_number} for user ${user.email}`);

    res.json({
      success: true,
      message: 'Credentials verified. OTP sent to your registered phone number.',
      data: {
        otpKey,
        phoneNumber: `***${user.phone_number.slice(-4)}`, // Masked phone number
        expiresIn: 60 // seconds
      }
    });

  } catch (error) {
    logger.error('Credential verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during credential verification'
    });
  }
});

/**
 * @route   POST /api/auth/login/verify-otp
 * @desc    Verify OTP and complete login
 * @access  Public
 */
router.post('/login/verify-otp', [
  body('otpKey')
    .notEmpty()
    .withMessage('OTP key is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { otpKey, otp } = req.body;

    logger.info(`🔍 Verifying OTP for key: ${otpKey}`);

    // Retrieve OTP data
    const otpData = otpStorage.get(otpKey);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP session',
        code: 'INVALID_OTP_SESSION'
      });
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check attempt limit (max 3 attempts)
    if (otpData.attempts >= 3) {
      otpStorage.delete(otpKey);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please start login process again.',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      otpStorage.set(otpKey, otpData);
      
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`,
        code: 'INVALID_OTP',
        attemptsRemaining: 3 - otpData.attempts
      });
    }

    // OTP is correct, clean up and get user data
    otpStorage.delete(otpKey);
    
    const user = await User.findByPk(otpData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        username: user.username,
        idNumber: user.id_number,
        businessNumber: user.business_registration_number
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await user.update({ last_login: new Date() });

    logger.info(`✅ User ${user.email} logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          idNumber: user.id_number,
          businessNumber: user.business_registration_number,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          phoneNumber: user.phone_number,
          taxNumber: user.tax_number,
          homeAffairsVerified: user.home_affairs_verified,
          isActive: user.is_active,
          isVerified: user.is_verified,
          accountType: user.business_registration_number ? 'business' : 'individual',
          lastLogin: user.last_login
        },
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification'
    });
  }
});

/**
 * @route   POST /api/auth/login/resend-otp
 * @desc    Resend OTP to user's phone number
 * @access  Public
 */
router.post('/login/resend-otp', [
  body('otpKey')
    .notEmpty()
    .withMessage('OTP key is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { otpKey } = req.body;

    logger.info(`🔍 Resending OTP for key: ${otpKey}`);

    // Retrieve OTP data
    const otpData = otpStorage.get(otpKey);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP session. Please start login process again.',
        code: 'INVALID_OTP_SESSION'
      });
    }

    // Get user data
    const user = await User.findByPk(otpData.userId);
    if (!user) {
      otpStorage.delete(otpKey);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const newOtpExpiry = Date.now() + (60 * 1000); // 60 seconds

    // Update OTP data
    otpStorage.set(otpKey, {
      ...otpData,
      otp: newOtp,
      expiresAt: newOtpExpiry,
      attempts: 0 // Reset attempts
    });

    // Send new OTP
    const smsResult = await sendOTP(user.phone_number, newOtp);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
        code: 'OTP_SEND_FAILED'
      });
    }

    logger.info(`✅ New OTP sent to ${user.phone_number} for user ${user.email}`);

    res.json({
      success: true,
      message: 'New OTP sent to your registered phone number.',
      data: {
        phoneNumber: `***${user.phone_number.slice(-4)}`, // Masked phone number
        expiresIn: 60 // seconds
      }
    });

  } catch (error) {
    logger.error('OTP resend error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP resend'
    });
  }
});

export default router;
