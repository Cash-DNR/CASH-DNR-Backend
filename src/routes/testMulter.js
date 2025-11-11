import express from 'express';
import { registrationUpload, singleFileUpload, handleMulterError } from '../controllers/newMulterConfig.js';
import logger from '../services/logger.js';

const router = express.Router();

// Simple test endpoint for single file upload
router.post('/single-file', singleFileUpload, handleMulterError, (req, res) => {
  try {
    logger.info('Single file test endpoint hit');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        receivedFields: Object.keys(req.body)
      });
    }

    logger.info('File received:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      formData: req.body
    });

  } catch (error) {
    logger.error('Single file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Test endpoint for registration-style multipart upload
router.post('/registration-files', registrationUpload, handleMulterError, (req, res) => {
  try {
    logger.info('Registration files test endpoint hit');
    logger.info('Form data received:', req.body);
    logger.info('Files received:', req.files);

    const uploadedFiles = {};
    let fileCount = 0;

    // Process each file type
    if (req.files) {
      if (req.files.idDocument) {
        uploadedFiles.idDocument = req.files.idDocument[0];
        fileCount++;
      }
      if (req.files.proofOfResidence) {
        uploadedFiles.proofOfResidence = req.files.proofOfResidence[0];
        fileCount++;
      }
      if (req.files.bankStatement) {
        uploadedFiles.bankStatement = req.files.bankStatement[0];
        fileCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${fileCount} file(s)`,
      files: uploadedFiles,
      formData: req.body,
      multerWorking: true
    });

  } catch (error) {
    logger.error('Registration files upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

export default router;