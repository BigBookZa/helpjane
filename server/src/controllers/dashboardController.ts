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

    // Get recent files
    const recentFiles = FileModel.getRecentFiles(userId, 10);

    // Get queue statistics
    const queueStats = QueueModel.getQueueStats(userId);

    // Get API usage for today
    const today = new Date().toISOString().split('T')[0];
    const apiUsage = ApiUsageModel.getDailyUsage(userId, today);

    // Calculate processing statistics
    const processingStats = {
      avgProcessingTime: FileModel.getAverageProcessingTime(userId),
      successRate: FileModel.getSuccessRate(userId),
      totalProcessed: userStats.processed_files,
      errorRate: FileModel.getErrorRate(userId)
    };

    // Get recent activity
    const recentActivity = FileModel.getRecentActivity(userId, 5);

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
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get comprehensive system statistics
    const stats = {
      database: {
        size: FileModel.getDatabaseSize(),
        totalRecords: FileModel.getTotalRecords()
      },
      storage: {
        totalFiles: FileModel.getTotalFileCount(userId),
        totalSize: FileModel.getTotalFileSize(userId),
        storageUsed: FileModel.getStorageUsage(userId)
      },
      processing: {
        queueLength: QueueModel.getQueueLength(),
        avgProcessingTime: FileModel.getAverageProcessingTime(userId),
        throughput: FileModel.getProcessingThroughput(userId)
      },
      api: {
        dailyUsage: ApiUsageModel.getDailyUsage(userId),
        monthlyUsage: ApiUsageModel.getMonthlyUsage(userId),
        errorRate: ApiUsageModel.getErrorRate(userId)
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
};