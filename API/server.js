import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Import routes - adjust paths to go up one level to src
import authRoutes from '../src/routes/auth.js';
import businessRoutes from '../src/routes/business.js';
import taxRoutes from '../src/routes/tax.js';
import transactionRoutes from '../src/routes/transactions.js';
import adminRoutes from '../src/routes/admin.js';
import profileRoutes from '../src/routes/profile.js';
import usersRoutes from '../src/routes/users.js';
import uploadRoutes from '../src/routes/upload.js';

// Import database configuration
import '../src/config/database.js';
import logger from '../src/services/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create required directories if they don't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const documentsDir = path.join(uploadDir, 'documents');
const tmpDir = path.join(__dirname, '..', 'tmp');

try {
  await fs.access(documentsDir);
  await fs.access(tmpDir);
} catch (error) {
  await fs.mkdir(documentsDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });
  logger.info('Created required directories');
}

// Configure file upload middleware first (before other middleware)
app.use(fileUpload({
    createParentPath: true,
    parseNested: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '..', 'tmp'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    debug: true
}));

// Debug middleware for multipart form data
app.use((req, res, next) => {
    if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
        console.log('📝 Processing multipart form data:', {
            fields: req.body,
            files: req.files ? Object.keys(req.files) : []
        });
    }
    next();
});

// Basic middleware setup - after file upload middleware
app.use(express.json());
app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb'
}));

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));

// Debug middleware for requests
app.use((req, res, next) => {
  console.log('\n🔍 Incoming Request Details:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);

  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('\n📁 File Upload Details:');
    console.log('Files Present:', !!req.files);
    if (req.files) {
      console.log('Files:', Object.keys(req.files).map(key => ({
        fieldName: key,
        name: req.files[key].name,
        size: req.files[key].size,
        mimetype: req.files[key].mimetype
      })));
    }
    console.log('Form Fields:', req.body);
  }
  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount all routes
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// API Routes with debug logging
app.use('/api', (req, res, next) => {
  console.log('⚡ Hit /api route handler');
  next();
}, authRoutes);

app.use('/api/business', businessRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);

// Debug middleware for unmatched routes
app.use((req, res) => {
  console.log('❌ No route matched for:', req.method, req.url);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the size limit (5MB)'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file',
      message: 'Received an unexpected file upload field'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(500).json({
      error: 'File system error',
      message: 'Could not access the upload directory'
    });
  }

  // For multipart/form-data errors, provide more context
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      debug: {
        contentType: req.headers['content-type'],
        filesPresent: !!req.files,
        bodyFields: Object.keys(req.body)
      }
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

export default app;
