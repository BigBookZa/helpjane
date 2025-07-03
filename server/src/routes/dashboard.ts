import express from 'express';
import { getDashboardData, getSystemStats } from '../controllers/dashboardController';

const router = express.Router();

// GET /api/dashboard - Get dashboard data
router.get('/', getDashboardData);

// GET /api/dashboard/stats - Get system statistics
router.get('/stats', getSystemStats);

export default router;