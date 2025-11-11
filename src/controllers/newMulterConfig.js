/* eslint-disable linebreak-style */
/* eslint-disable no-trailing-spaces */
/* eslint-disable space-before-function-paren */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../services/logger.js';

// ========================
// FRESH MULTER CONFIGURATION
// ========================

// Create base uploads directory
const uploadsDir = path.resolve('./uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create category subdirectories
const categories = ['id_documents', 'proof_of_address', 'bank_statements', 'tax_documents', 'other'];
categories.forEach(category => {
  const categoryPath = path.join(uploadsDir, category);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
});

// Field name to file category mapping
const getFileCategory = (fieldname) => {
  const categoryMap = {
    // ID Document variations
    'idDocument': 'id_documents',
    'id_document': 'id_documents', 
    'id_documents': 'id_documents',
    
    // Proof of residence/address variations
    'proofOfResidence': 'proof_of_address',
    'proof_of_residence': 'proof_of_address',
    'proofOfAddress': 'proof_of_address',
    'proof_of_address': 'proof_of_address',
    
    // Bank statement variations
    'bankStatement': 'bank_statements',
    'bank_statement': 'bank_statements',
    'bank_statements': 'bank_statements',
    
    // Other documents
    'other': 'other',
    'other_documents': 'other'
  };
  
  return categoryMap[fieldname] || 'other';
};

// Get file type for database (normalized form)
const getFileType = (fieldname) => {
  const typeMap = {
    'idDocument': 'id_document',
    'id_document': 'id_document',
    'id_documents': 'id_document',
    
    'proofOfResidence': 'proof_of_address', 
    'proof_of_residence': 'proof_of_address',
    'proofOfAddress': 'proof_of_address',
    'proof_of_address': 'proof_of_address',
    
    'bankStatement': 'bank_statement',
    'bank_statement': 'bank_statement', 
    'bank_statements': 'bank_statement',
    
    'other': 'other',
    'other_documents': 'other'
  };
  
  return typeMap[fieldname] || 'other';
};

// Multer storage configuration
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = getFileCategory(file.fieldname);
    const destinationPath = path.join(uploadsDir, category);
    
    logger.info(`Multer destination for ${file.fieldname}: ${destinationPath}`);
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || 'anonymous';
    
    const fileName = `${timestamp}-${randomSuffix}-${userId}${extension}`;
    
    logger.info(`Multer filename for ${file.originalname}: ${fileName}`);
    cb(null, fileName);
  }
});

// File filter for allowed types
const multerFileFilter = function (req, file, cb) {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  logger.info(`File filter check: ${file.originalname} (${file.mimetype})`);

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`File type ${file.mimetype} not allowed. Allowed: ${allowedTypes.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Create fresh multer instance
export const freshMulter = multer({
  storage: multerStorage,
  fileFilter: multerFileFilter,
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB per file
    files: 5, // Maximum 5 files per request
    fields: 20, // Allow up to 20 form fields
    fieldNameSize: 100, // Max field name length
    fieldSize: 1024 * 1024 // Max field value size (1MB for text fields)
  }
});

// Registration-specific multer fields configuration
export const registrationUpload = freshMulter.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 }, 
  { name: 'bankStatement', maxCount: 1 }
]);

// Single file upload
export const singleFileUpload = freshMulter.single('file');

// Multiple files upload (for general use)
export const multipleFilesUpload = freshMulter.array('files', 5);

// Export helper functions
export { getFileCategory, getFileType };

// Error handler for multer errors
export const handleMulterError = (error, req, res, next) => {
  logger.error('Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 400MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Check field names.',
          error: 'UNEXPECTED_FILE_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          error: error.code
        });
    }
  } else if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  // Pass other errors to the next error handler
  next(error);
};

logger.info('Fresh multer configuration loaded successfully');