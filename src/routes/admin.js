import express from 'express';

const router = express.Router();

// Admin routes will be implemented here
router.get('/stats', (req, res) => {
  res.json({ message: 'Admin stats endpoint - coming soon' });
});

router.get('/users', (req, res) => {
  res.json({ message: 'Admin users endpoint - coming soon' });
});

export default router;
