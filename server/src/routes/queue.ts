import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented with queue functionality
router.get('/status', (req, res) => {
  res.json({ status: 'idle', queue: [] });
});

export default router;