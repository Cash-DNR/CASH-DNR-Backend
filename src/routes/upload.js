/* eslint-disable linebreak-style */
import express from 'express';
import auth from '../middleware/auth.js';
import { downloadFile, listFiles, deleteFile } from '../controllers/uploadController.js';
import { upload as securedUpload, uploadMultipleFiles, uploadSingleFile, uploadRegistrationDocuments } from '../controllers/fileController.js';

const router = express.Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single file (400MB limit) and persist to DB
 * @access  Private
 */
router.post('/single', auth, securedUpload.single('file'), uploadSingleFile);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (400MB limit each) and persist to DB
 * @access  Private
 */
router.post('/multiple', auth, securedUpload.array('files', 10), uploadMultipleFiles);

/**
 * @route   GET /api/upload/files
 * @desc    List all uploaded files
 * @access  Public (for now)
 */
router.get('/files', listFiles);

/**
 * @route   GET /api/upload/download/:filename
 * @desc    Download a file
 * @access  Public (for now)
 */
router.get('/download/:filename', downloadFile);

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete a file
 * @access  Public (for now)
 */
router.delete('/:filename', deleteFile);

// Secured user-specific file routes
/**
 * @route   POST /api/upload/user/single
 * @desc    Upload a single file for the authenticated user with categorization
 * @access  Private
 */
router.post('/user/single', auth, securedUpload.single('file'), uploadSingleFile);

/**
 * @route   POST /api/upload/user/multiple
 * @desc    Upload multiple files for the authenticated user with categorization
 * @access  Private
 */
router.post('/user/multiple', auth, securedUpload.array('files', 10), uploadMultipleFiles);

/**
 * @route   POST /api/upload/registration-documents
 * @desc    Final registration step: upload ID, proof of residence, bank statement, plus others
 *          Expects fields: id_document, proof_of_residence, bank_statement, other_documents (array)
 * @access  Private
 */
router.post(
  '/registration-documents',
  auth,
  securedUpload.fields([
    { name: 'id_document', maxCount: 5 },
    { name: 'proof_of_residence', maxCount: 5 },
    { name: 'bank_statement', maxCount: 5 },
    { name: 'other_documents', maxCount: 20 }
  ]),
  uploadRegistrationDocuments
);

export default router;
