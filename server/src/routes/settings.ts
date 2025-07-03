import express from 'express';
import { 
  getSettings, 
  updateSettings, 
  testApiConnection,
  exportSettings,
  importSettings
} from '../controllers/settingsController';

const router = express.Router();

// GET /api/settings - Get user settings
router.get('/', getSettings);

// PUT /api/settings - Update user settings
router.put('/', updateSettings);

// POST /api/settings/test - Test API connections
router.post('/test', testApiConnection);

// GET /api/settings/export - Export settings
router.get('/export', exportSettings);

// POST /api/settings/import - Import settings
router.post('/import', importSettings);

export default router;