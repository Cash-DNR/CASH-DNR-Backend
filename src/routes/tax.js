import express from 'express';

const router = express.Router();

// Tax calculation routes will be implemented here
router.get('/calculate', (req, res) => {
  res.json({ message: 'Tax calculation endpoint - coming soon' });
});

router.post('/submit', (req, res) => {
  res.json({ message: 'Tax submission endpoint - coming soon' });
});

export default router;
