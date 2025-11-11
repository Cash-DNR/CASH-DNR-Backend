import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Import routes
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import taxRoutes from './routes/tax.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import usersRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import cashNotesRoutes from './routes/cashNotes.js';
// import chatRoutes from './routes/chat.js'; // Disabled - chat functionality removed
import notificationsRoutes from './routes/notifications.js';
import realtimeRoutes from './routes/realtime.js';
import debugRoutes from './routes/debug.js';
import testMulterRoutes from './routes/testMulter.js';

// Import database configuration
import './config/database.js';
import logger from './services/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Consolidated CORS configuration for both HTTP and Socket.IO
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://cash-dnr-backend.onrender.com'
];

// Allow configuring additional origins via env (comma-separated)
const envOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const corsOptions = {
  origin: function(origin, callback) {
    // Allow non-browser requests (like Postman) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

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

// Apply CORS early so preflight (OPTIONS) requests are handled before other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configure file upload middleware with better error handling
const fileUploadConfig = {
  createParentPath: true,
  parseNested: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '..', 'tmp'),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased from 5MB)
    files: 15, // Maximum 15 files
    fieldSize: 5 * 1024 * 1024 // 5MB field size limit
  },
  debug: false,
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: false, // Don't abort on limit, handle gracefully
  responseOnLimit: 'File too large (maximum 50MB allowed)',
  uploadTimeout: 120000, // 2 minute timeout (increased for larger files)
  // Handle multipart parsing errors
  parseNested: true
};

// Apply file upload middleware only to specific routes
// NOTE: Do NOT apply to /api/upload routes as they use multer instead
// app.use('/api/upload', fileUpload(fileUploadConfig)); // DISABLED - conflicts with multer

// Multipart form validation and debugging middleware - DISABLED to prevent conflicts with multer
// app.use((req, res, next) => {
//   if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
//     console.log('📝 Processing multipart form data:', {
//       contentLength: req.headers['content-length'],
//       boundary: req.headers['content-type'].includes('boundary=') ? 'present' : 'missing',
//       fields: req.body,
//       files: req.files ? Object.keys(req.files) : []
//     });

//     // Validate that the multipart request has proper boundary
//     const contentType = req.headers['content-type'];
//     if (!contentType.includes('boundary=')) {
//       return res.status(400).json({
//         error: 'Invalid multipart format',
//         message: 'Multipart form data is missing boundary parameter',
//         code: 'MISSING_BOUNDARY'
//       });
//     }

//     // Check content length
//     const contentLength = parseInt(req.headers['content-length'] || '0');
//     if (contentLength === 0) {
//       return res.status(400).json({
//         error: 'Empty upload',
//         message: 'No data received in the upload request',
//         code: 'EMPTY_UPLOAD'
//       });
//     }
//   }
//   next();
// });

// Basic middleware setup - Skip body parsing for routes that handle their own multipart parsing
app.use((req, res, next) => {
  // Skip JSON/URL body parsing for multipart form data on specific routes that use multer
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Let routes that use multer (like /api/auth/citizen) handle their own parsing
    return next();
  }
  
  // Apply body parsers for non-multipart requests
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  // Skip URL encoding for multipart form data on specific routes that use multer
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Let routes that use multer handle their own parsing
    return next();
  }
  
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));

// Debug middleware for requests
app.use((req, res, next) => {
  console.log('\n� Incoming Request Details:');
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

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CASH-DNR Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      upload: '/api/upload/*',
      cashNotes: '/api/cash-notes/*',
      notifications: '/api/notifications/*',
      realtime: '/api/realtime/*'
    },
    websocket: {
      endpoint: 'ws://localhost:3000',
      events: ['notification', 'balance_update', 'cash_note_update', 'activity_update']
    }
  });
});

// Mount all routes
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// API Routes with debug logging
app.use('/api/auth', (req, res, next) => {
  console.log('⚡ Hit /api/auth route handler');
  next();
}, authRoutes);

app.use('/api/business', businessRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test-multer', testMulterRoutes);
// Phase 1 - Cash Notes API
app.use('/api/cash-notes', cashNotesRoutes);

// Real-time features API (chat disabled)
// app.use('/api/chat', chatRoutes); // Disabled - chat functionality removed
app.use('/api/notifications', notificationsRoutes);
app.use('/api/realtime', realtimeRoutes);

// Handle WebSocket endpoint requests (placeholder)
app.get('/ws', (req, res) => {
  console.log('📡 WebSocket endpoint accessed - returning info message');
  res.status(200).json({
    success: false,
    message: 'WebSocket endpoint not implemented',
    info: 'This endpoint is for WebSocket connections which are not currently supported',
    availableEndpoints: {
      health: '/health',
      auth: '/api/auth/*',
      upload: '/api/upload/*',
      cashNotes: '/api/cash-notes/*'
    }
  });
});

// Debug middleware for unmatched routes
app.use((req, res) => {
  console.log('❌ No route matched for:', req.method, req.url);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err);

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the size limit (50MB)'
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

  // Handle multipart parsing errors specifically
  if (err.message && err.message.includes('Unexpected end of form')) {
    return res.status(400).json({
      error: 'Upload interrupted',
      message: 'File upload was interrupted or incomplete. Please try again.',
      code: 'UPLOAD_INTERRUPTED',
      suggestion: 'Check your internet connection and try uploading again'
    });
  }

  // Handle busboy/multipart errors
  if (err.message && (err.message.includes('Multipart') || err.message.includes('busboy'))) {
    return res.status(400).json({
      error: 'Invalid file upload format',
      message: 'The file upload format is invalid or corrupted',
      code: 'INVALID_MULTIPART',
      suggestion: 'Ensure you are uploading valid files with correct form data'
    });
  }

  // For multipart/form-data errors, provide more context
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      code: err.code || 'UPLOAD_ERROR',
      debug: process.env.NODE_ENV === 'development' ? {
        contentType: req.headers['content-type'],
        filesPresent: !!req.files,
        bodyFields: Object.keys(req.body || {}),
        errorStack: err.stack
      } : undefined
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3000;

// Import and initialize Socket.IO handlers
import { initializeSocketHandlers } from './services/realtimeService.js';
initializeSocketHandlers(io);

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready on ws://localhost:${PORT}`);
});

export default app;
export { io };
