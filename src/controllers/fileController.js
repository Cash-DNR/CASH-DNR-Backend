/* eslint-disable linebreak-style */
/* eslint-disable no-trailing-spaces */
/* eslint-disable space-before-function-paren */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import logger from '../services/logger.js';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file categories
const createCategoryDirs = () => {
  const categories = ['id_documents', 'proof_of_address', 'bank_statements', 'tax_documents', 'other'];
  categories.forEach(category => {
    const categoryDir = path.join(uploadsDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  });
};

createCategoryDirs();

// Helper to map field names to categories
const fieldNameToCategory = (fieldname) => {
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

// Multer configuration with 400MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const derivedCategory = fieldNameToCategory(file.fieldname);
    const category = req.body.category || derivedCategory || 'other';
    const categoryDir = path.join(uploadsDir, category);
    
    // Ensure category directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    cb(null, categoryDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userId-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const userId = req.user?.id || 'anonymous';
    const fileName = `${uniqueSuffix}-${userId}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX`), false);
  }
};

// Multer instance with 400MB limit
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

/**
 * Upload single file
 */
export const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { originalname, filename, path: filePath, mimetype, size } = req.file;
    const { category = 'other', description } = req.body;

    // Create file record in database
    const fileRecord = await File.create({
      original_name: originalname,
      file_name: filename,
      file_path: filePath,
      mime_type: mimetype,
      file_size: size,
      file_category: category,
      user_id: req.user.id,
      description: description,
      upload_status: 'completed',
      metadata: {
        uploadedAt: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    logger.info(`File uploaded successfully: ${filename} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: {
          id: fileRecord.id,
          originalName: fileRecord.original_name,
          fileName: fileRecord.file_name,
          mimeType: fileRecord.mime_type,
          fileSize: fileRecord.file_size,
          category: fileRecord.file_category,
          uploadStatus: fileRecord.upload_status,
          description: fileRecord.description,
          uploadedAt: fileRecord.created_at
        }
      }
    });

  } catch (error) {
    logger.error('File upload error:', error);
    
    // Clean up uploaded file if database operation fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      const { originalname, filename, path: filePath, mimetype, size } = file;
      const categoryForFile = fieldNameToCategory(file.fieldname) || req.body.category || 'other';

      const fileRecord = await File.create({
        original_name: originalname,
        file_name: filename,
        file_path: filePath,
        mime_type: mimetype,
        file_size: size,
        file_category: categoryForFile,
        user_id: req.user.id,
        upload_status: 'completed',
        metadata: {
          uploadedAt: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });

      uploadedFiles.push({
        id: fileRecord.id,
        originalName: fileRecord.original_name,
        fileName: fileRecord.file_name,
        mimeType: fileRecord.mime_type,
        fileSize: fileRecord.file_size,
        category: fileRecord.file_category,
        uploadStatus: fileRecord.upload_status,
        uploadedAt: fileRecord.created_at
      });
    }

    logger.info(`${uploadedFiles.length} files uploaded successfully by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });

  } catch (error) {
    logger.error('Multiple file upload error:', error);
    
    // Clean up uploaded files if database operation fails
    if (req.files) {
      req.files.forEach(file => {
        try {
          if (file.path) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkError) {
          logger.error('Failed to clean up uploaded file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload registration documents (ID, Proof of Residence, Bank Statement, others)
 * Expects multipart form with fields: id_document, proof_of_residence, bank_statement, other_documents
 */
export const uploadRegistrationDocuments = async (req, res) => {
  try {
    const filesObject = req.files || {};
    const allFiles = Object.values(filesObject).flat();

    if (!allFiles || allFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No documents uploaded' });
    }

    const created = [];
    for (const file of allFiles) {
      const { originalname, filename, path: filePath, mimetype, size, fieldname } = file;
      const categoryForFile = fieldNameToCategory(fieldname);

      const record = await File.create({
        original_name: originalname,
        file_name: filename,
        file_path: filePath,
        mime_type: mimetype,
        file_size: size,
        file_category: categoryForFile,
        user_id: req.user.id,
        upload_status: 'completed',
        metadata: {
          uploadedAt: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          fieldname
        }
      });

      created.push({
        id: record.id,
        originalName: record.original_name,
        fileName: record.file_name,
        category: record.file_category
      });
    }

    // Check required documents presence
    const requiredCategories = ['id_documents', 'proof_of_address', 'bank_statements'];
    const counts = {};
    for (const cat of requiredCategories) {
      counts[cat] = await File.count({ where: { user_id: req.user.id, file_category: cat } });
    }

    let verificationUpdated = false;
    if (requiredCategories.every(cat => (counts[cat] || 0) > 0)) {
      if (!req.user.is_verified) {
        req.user.is_verified = true;
        await req.user.save();
        verificationUpdated = true;
      }
    }

    return res.status(201).json({
      success: true,
      message: verificationUpdated
        ? 'Documents uploaded and registration completed'
        : 'Documents uploaded. Awaiting remaining required documents',
      data: {
        uploaded: created,
        requirements: {
          id_documents: counts.id_documents || 0,
          proof_of_address: counts.proof_of_address || 0,
          bank_statements: counts.bank_statements || 0
        },
        isVerified: req.user.is_verified
      }
    });
  } catch (error) {
    logger.error('Registration documents upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload registration documents' });
  }
};

/**
 * Get user's files
 */
export const getUserFiles = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };
    if (category) {
      whereClause.file_category = category;
    }

    const { count, rows: files } = await File.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'original_name', 'file_name', 'mime_type', 'file_size', 'file_category', 'upload_status', 'description', 'created_at']
    });

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Download file
 */
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: {
        id: fileId,
        user_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);

    logger.info(`File downloaded: ${file.original_name} by user ${req.user.id}`);

  } catch (error) {
    logger.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'File download failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete file
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: {
        id: fileId,
        user_id: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete file record from database
    await file.destroy();

    logger.info(`File deleted: ${file.original_name} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'File deletion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get file info
 */
export const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      where: {
        id: fileId,
        user_id: req.user.id
      },
      attributes: ['id', 'original_name', 'file_name', 'mime_type', 'file_size', 'file_category', 'upload_status', 'description', 'metadata', 'created_at', 'updated_at']
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: {
        file
      }
    });

  } catch (error) {
    logger.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
