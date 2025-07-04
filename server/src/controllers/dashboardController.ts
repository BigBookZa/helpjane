import { Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { FileModel } from '../models/File';
import { QueueModel } from '../models/Queue';
import { ApiUsageModel } from '../models/ApiUsage';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user projects and stats
    const projects = ProjectModel.findByUser(userId);
    const userStats = ProjectModel.getUserStats(userId);

    // Get recent files (with fallback)
    let recentFiles = [];
    try {
      recentFiles = FileModel.getRecentFiles(userId, 10);
    } catch (error) {
      console.warn('Failed to get recent files:', error);
      recentFiles = [];
    }

    // Get queue statistics (with fallback)
    let queueStats = { pending: 0, processing: 0, completed: 0, failed: 0 };
    try {
      queueStats = QueueModel.getQueueStats(userId);
    } catch (error) {
      console.warn('Failed to get queue stats:', error);
    }

    // Get API usage for today (with fallback)
    const today = new Date().toISOString().split('T')[0];
    let apiUsage = { total_tokens: 0, total_requests: 0, total_cost: 0 };
    try {
      apiUsage = ApiUsageModel.getDailyUsage(userId, today);
    } catch (error) {
      console.warn('Failed to get API usage:', error);
    }

    // Calculate processing statistics (with fallback)
    let processingStats = {
      avgProcessingTime: '0s',
      successRate: 0,
      totalProcessed: userStats.processed_files,
      errorRate: 0
    };
    
    try {
      processingStats = {
        avgProcessingTime: FileModel.getAverageProcessingTime(userId),
        successRate: FileModel.getSuccessRate(userId),
        totalProcessed: userStats.processed_files,
        errorRate: FileModel.getErrorRate(userId)
      };
    } catch (error) {
      console.warn('Failed to get processing stats:', error);
    }

    // Get recent activity (with fallback)
    let recentActivity = [];
    try {
      recentActivity = FileModel.getRecentActivity(userId, 5);
    } catch (error) {
      console.warn('Failed to get recent activity:', error);
      recentActivity = [];
    }

    const dashboardData = {
      user: req.user,
      stats: {
        totalProjects: userStats.total_projects,
        activeProjects: userStats.active_projects,
        totalFiles: userStats.total_files,
        processedFiles: userStats.processed_files,
        successRate: processingStats.successRate,
        avgProcessingTime: processingStats.avgProcessingTime
      },
      projects: projects.slice(0, 5), // Recent 5 projects
      recentFiles,
      queueStats: {
        totalInQueue: queueStats.pending + queueStats.processing,
        processing: queueStats.processing,
        completed: queueStats.completed,
        failed: queueStats.failed,
        queueStatus: queueStats.processing > 0 ? 'running' : 'idle'
      },
      apiUsage: {
        tokensUsedToday: apiUsage.total_tokens,
        requestsToday: apiUsage.total_requests,
        costToday: apiUsage.total_cost,
        tokensLimit: 50000 // This should come from settings
      },
      recentActivity,
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastUpdate: new Date().toISOString()
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get comprehensive system statistics with fallbacks
    const stats = {
      database: {
        size: 0,
        totalRecords: 0
      },
      storage: {
        totalFiles: 0,
        totalSize: 0,
        storageUsed: { used: 0, available: 1024 * 1024 * 1024 * 10, percentage: 0 }
      },
      processing: {
        queueLength: 0,
        avgProcessingTime: '0s',
        throughput: 0
      },
      api: {
        dailyUsage: { total_tokens: 0, total_requests: 0, total_cost: 0 },
        monthlyUsage: { total_tokens: 0, total_requests: 0, total_cost: 0 },
        errorRate: 0
      }
    };

    try {
      stats.database.totalRecords = FileModel.getTotalRecords();
      stats.storage.totalFiles = FileModel.getTotalFileCount(userId);
      stats.storage.totalSize = FileModel.getTotalFileSize(userId);
      stats.storage.storageUsed = FileModel.getStorageUsage(userId);
      stats.processing.queueLength = QueueModel.getQueueLength();
      stats.processing.avgProcessingTime = FileModel.getAverageProcessingTime(userId);
      stats.processing.throughput = FileModel.getProcessingThroughput(userId);
      stats.api.dailyUsage = ApiUsageModel.getDailyUsage(userId);
      stats.api.monthlyUsage = ApiUsageModel.getMonthlyUsage(userId);
      stats.api.errorRate = ApiUsageModel.getErrorRate(userId);
    } catch (error) {
      console.warn('Some system stats failed to load:', error);
    }

    res.json(stats);
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};