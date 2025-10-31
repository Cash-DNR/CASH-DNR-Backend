/* eslint-disable linebreak-style */
import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import logger from '../services/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.userId;
    const uploadDir = path.join(process.cwd(), 'uploads', userId);

    // Create user-specific directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: documentType-timestamp.extension
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${timestamp}${extension}`);
  }
});

// File filter for allowed document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const requiredDocuments = [
  { name: 'idCopy', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 },
  { name: 'supportingDocs', maxCount: 3 }
];

/**
 * @route   PUT /api/users/:userId/contact-details
 * @desc    Update user's contact details
 * @access  Private
 */
router.put('/:userId/contact-details', [
  body('phone')
    .matches(/^\+27\s\d{2}\s\d{3}\s\d{4}$/)
    .withMessage('Valid South African phone number required (format: +27 82 123 4567)'),
  body('alternativePhone')
    .optional()
    .matches(/^\+27\s\d{2}\s\d{3}\s\d{4}$/)
    .withMessage('Valid South African phone number required (format: +27 82 123 4567)'),
  body('homeAddress.streetAddress')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),
  body('homeAddress.town')
    .notEmpty()
    .withMessage('Town is required'),
  body('homeAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('homeAddress.province')
    .notEmpty()
    .withMessage('Province is required')
    .isIn(['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
      'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'])
    .withMessage('Invalid province'),
  body('homeAddress.postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^\d{4}$/)
    .withMessage('Valid South African postal code required (4 digits)')
], async(req, res) => {
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
    const { phone, alternativePhone, homeAddress } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update contact details
    await user.update({
      phone,
      alternativePhone,
      homeAddress
    });

    logger.info(`Contact details updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Contact details updated successfully',
      data: {
        phone,
        alternativePhone,
        homeAddress
      }
    });
  } catch (error) {
    logger.error('Error updating contact details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error updating contact details'
    });
  }
});

/**
 * @route   POST /api/users/:userId/documents
 * @desc    Upload user documents
 * @access  Private
 */
router.post('/:userId/documents', upload.fields(requiredDocuments), async(req, res) => {
  try {
    const { userId } = req.params;
    const files = req.files;

    // Check if all required documents are provided
    if (!files.idCopy || !files.proofOfResidence) {
      return res.status(400).json({
        success: false,
        message: 'ID copy and proof of residence are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store document metadata in user record
    const documents = {};
    for (const [docType, fileArray] of Object.entries(files)) {
      documents[docType] = fileArray.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date()
      }));
    }

    await user.update({
      documents,
      documentStatus: 'Pending Review'
    });

    logger.info(`Documents uploaded for user ${userId}`);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents,
        status: 'Pending Review'
      }
    });
  } catch (error) {
    logger.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error uploading documents'
    });
  }
});

export default router;
