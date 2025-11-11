import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Simple multer configuration for debugging
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/debug';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const debugUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

// Debug route to test multipart uploads
router.post('/debug-multipart', debugUpload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 }
]), (req, res) => {
  console.log('🐛 Debug multipart endpoint hit');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  try {
    res.json({
      success: true,
      message: 'Multipart upload successful',
      body: req.body,
      files: req.files ? Object.keys(req.files) : [],
      fileDetails: req.files ? Object.entries(req.files).map(([key, files]) => ({
        field: key,
        count: files.length,
        files: files.map(f => ({ name: f.originalname, size: f.size }))
      })) : []
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;