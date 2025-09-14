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
import logger from '../services/logger.js';

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

    const { email, password, idNumber, homeAddress, phoneNumber } = req.body;

    logger.info(`🔍 Starting registration for ID: ${idNumber}`);

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

    // Check if user already has a tax number from Home Affairs data, if not generate one
    let taxNumber = homeAffairsData.taxNumber || homeAffairsData.taxId;
    if (!taxNumber) {
      taxNumber = generateTaxNumber(idNumber);
      console.log(`🔢 Generated tax number: ${taxNumber}`);
    } else {
      console.log(`✅ Using existing tax number from Home Affairs: ${taxNumber}`);
    }

    // Create user with Home Affairs data
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
        taxNumberGenerated: !homeAffairsData.taxNumber && !homeAffairsData.taxId,
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

export default router;
