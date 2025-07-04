import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented with file upload functionality
router.get('/project/:projectId', (req, res) => {
  res.json([]);
});

router.post('/upload', (req, res) => {
  res.json({ message: 'File upload not yet implemented' });
});

export default router;