import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { verifyIdWithHomeAffairs, validateRegistrationMatch } from '../services/homeAffairs.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('idNumber')
    .optional()
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

    const { username, email, password, firstName, lastName, idNumber } = req.body;

    // Home Affairs ID verification if ID number is provided
    let homeAffairsData = null;
    let homeAffairsVerified = false;
    
    if (idNumber) {
      console.log(`🔍 Verifying ID number: ${idNumber}`);
      
      // Check if ID number is already registered
      const existingIdUser = await User.findOne({ where: { id_number: idNumber } });
      if (existingIdUser) {
        return res.status(400).json({
          success: false,
          message: 'This ID number is already registered'
        });
      }

      // Verify with Home Affairs
      const idVerificationResult = await verifyIdWithHomeAffairs(idNumber);
      
      if (!idVerificationResult.success) {
        // If ID validation is required, reject registration
        if (process.env.ID_VALIDATION_REQUIRED === 'true') {
          return res.status(400).json({
            success: false,
            message: idVerificationResult.message,
            details: idVerificationResult.validationDetails,
            idVerification: idVerificationResult
          });
        } else {
          // Log warning but allow registration
          console.warn('⚠️ ID verification failed but validation not required:', idVerificationResult.message);
        }
      } else {
        homeAffairsData = idVerificationResult.data;
        homeAffairsVerified = true;

        // Validate that registration data matches Home Affairs data
        const matchValidation = validateRegistrationMatch(
          { firstName, lastName },
          homeAffairsData
        );

        if (!matchValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Registration details do not match Home Affairs records',
            errors: matchValidation.errors,
            homeAffairsData: {
              firstName: homeAffairsData?.firstName,
              lastName: homeAffairsData?.lastName,
              dateOfBirth: homeAffairsData?.dateOfBirth,
              gender: homeAffairsData?.gender
            }
          });
        }

        console.log('✅ Home Affairs verification successful');
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Prepare user data
    const userData = {
      username,
      email,
      password_hash: password, // Will be hashed by the model hook
      first_name: firstName,
      last_name: lastName,
      home_affairs_verified: homeAffairsVerified
    };

    // Add Home Affairs data if available
    if (homeAffairsData) {
      userData.id_number = idNumber;
      userData.date_of_birth = homeAffairsData.dateOfBirth;
      userData.gender = homeAffairsData.gender;
    }

    // Create new user
    const user = await User.create(userData);

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

    res.status(201).json({
      success: true,
      message: homeAffairsVerified 
        ? 'User registered successfully with Home Affairs verification' 
        : 'User registered successfully',
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
          homeAffairsVerified: user.home_affairs_verified,
          isActive: user.is_active,
          isVerified: user.is_verified
        },
        token,
        homeAffairsVerification: homeAffairsVerified ? {
          verified: true,
          source: homeAffairsData ? 'home-affairs-api' : 'mock-data'
        } : null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

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
    console.error('Login error:', error);
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

    console.log(`🔍 ID verification request for: ${idNumber}`);

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
    console.error('ID verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during ID verification'
    });
  }
});

export default router;
