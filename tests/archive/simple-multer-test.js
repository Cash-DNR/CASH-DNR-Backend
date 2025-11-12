const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3001;

// Simple multer configuration
const upload = multer({
  dest: './test-uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Skip body parsing for multipart
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});

// Test route with multer
app.post('/test-upload', upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfResidence', maxCount: 1 }
]), (req, res) => {
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  res.json({
    success: true,
    body: req.body,
    files: Object.keys(req.files || {}),
    fileDetails: req.files ? Object.entries(req.files).map(([key, files]) => ({
      field: key,
      count: files.length,
      names: files.map(f => f.originalname)
    })) : []
  });
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
  console.log('Test with: curl -F "idDocument=@test.txt" -F "name=John" http://localhost:3001/test-upload');
});