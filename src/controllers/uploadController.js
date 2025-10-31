import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../services/logger.js';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('📁 Created uploads directory');
} else {
  logger.info('📁 Uploads directory already exists');
}

// Multer configuration with 400MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    logger.info(`📂 File destination: ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uniqueSuffix}${fileExtension}`;
    logger.info(`📝 Generated filename: ${fileName} for original: ${file.originalname}`);
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

  logger.info(`🔍 File filter check: ${file.originalname} (${file.mimetype})`);

  if (allowedMimes.includes(file.mimetype)) {
    logger.info(`✅ File type allowed: ${file.mimetype}`);
    cb(null, true);
  } else {
    logger.warn(`❌ File type rejected: ${file.mimetype}`);
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
export const uploadSingle = (req, res) => {
  try {
    logger.info('🚀 Single file upload request received');

    if (!req.file) {
      logger.warn('❌ No file in upload request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { originalname, filename, path: filePath, mimetype, size } = req.file;

    logger.info(`📤 File uploaded successfully:
      Original Name: ${originalname}
      Generated Name: ${filename}
      File Path: ${filePath}
      MIME Type: ${mimetype}
      File Size: ${(size / 1024 / 1024).toFixed(2)} MB
      Upload Time: ${new Date().toISOString()}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        originalName: originalname,
        fileName: filename,
        filePath: filePath,
        mimeType: mimetype,
        fileSize: size,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

/**
 * Upload multiple files
 */
export const uploadMultiple = (req, res) => {
  try {
    logger.info('🚀 Multiple file upload request received');

    if (!req.files || req.files.length === 0) {
      logger.warn('❌ No files in upload request');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    logger.info(`📤 Processing ${req.files.length} files`);

    const uploadedFiles = req.files.map((file, index) => {
      logger.info(`📄 File ${index + 1}/${req.files.length}:
        Original Name: ${file.originalname}
        Generated Name: ${file.filename}
        File Path: ${file.path}
        MIME Type: ${file.mimetype}
        File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      return {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      };
    });

    logger.info(`✅ All ${uploadedFiles.length} files uploaded successfully`);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });

  } catch (error) {
    logger.error('❌ Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

/**
 * Download file
 */
export const downloadFile = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    logger.info(`📥 Download request for file: ${filename}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.warn(`❌ File not found: ${filename}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    logger.info(`📥 Downloading file: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Set appropriate headers
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      logger.info(`✅ File download completed: ${filename}`);
    });

  } catch (error) {
    logger.error('❌ Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed',
      error: error.message
    });
  }
};

/**
 * List uploaded files
 */
export const listFiles = (req, res) => {
  try {
    logger.info('📋 File list request received');

    const files = fs.readdirSync(uploadsDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    logger.info(`📋 Found ${fileList.length} files in uploads directory`);

    res.json({
      success: true,
      data: {
        files: fileList,
        count: fileList.length
      }
    });

  } catch (error) {
    logger.error('❌ List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message
    });
  }
};

/**
 * Delete file
 */
export const deleteFile = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    logger.info(`🗑️ Delete request for file: ${filename}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.warn(`❌ File not found for deletion: ${filename}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file size before deletion for logging
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Delete file
    fs.unlinkSync(filePath);

    logger.info(`✅ File deleted successfully: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
};
