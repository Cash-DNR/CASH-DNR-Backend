/* eslint-disable linebreak-style */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable space-before-function-paren */
/* eslint-disable no-trailing-spaces */
/* eslint-disable linebreak-style */
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { verifyIdWithHomeAffairs, validateRegistrationMatch } from '../services/homeAffairs.js';
import { sarsComplianceChecker } from '../services/SARS.js';
import logger from '../services/logger.js';

const router = express.Router();



/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1 })
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
          isActive: user.is_active,
          isVerified: user.is_verified
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
 * Main registration - only requires email, idNumber, password
 * Personal details are fetched from Home Affairs API
 */
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('idNumber')
    .isLength({ min: 13, max: 13 })
    .withMessage('South African ID number must be exactly 13 digits')
    .isNumeric()
    .withMessage('ID number must contain only numbers'),
  body('consentToRegister')
    .optional()
    .isBoolean()
    .withMessage('Consent to register must be a boolean value')
], sarsComplianceChecker, async (req, res) => {
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

    const { email, password, idNumber } = req.body;

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
        homeAffairsVerification: {
          verified: true,
          source: 'home-affairs-api',
          personalDetails: {
            firstName: homeAffairsData.firstName,
            lastName: homeAffairsData.lastName,
            dateOfBirth: homeAffairsData.dateOfBirth,
            gender: homeAffairsData.gender,
            citizenship: homeAffairsData.citizenship,
            maritalStatus: homeAffairsData.maritalStatus
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

export default router;
