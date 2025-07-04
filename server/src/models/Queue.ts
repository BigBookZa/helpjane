import db from '../database/connection';

export interface QueueJob {
  id: number;
  file_id: number;
  user_id: number;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  attempts: number;
  max_attempts: number;
  payload?: string;
  result?: string;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class QueueModel {
  private static getQueueStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'retrying' THEN 1 ELSE 0 END) as retrying
    FROM queue_jobs 
    WHERE user_id = ?
  `);

  private static getQueueLength = db.prepare(`
    SELECT COUNT(*) as count 
    FROM queue_jobs 
    WHERE status IN ('pending', 'processing', 'retrying')
  `);

  static getQueueStats(userId: number): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
  } {
    const result = this.getQueueStats.get(userId) as any;
    return {
      pending: result.pending || 0,
      processing: result.processing || 0,
      completed: result.completed || 0,
      failed: result.failed || 0,
      retrying: result.retrying || 0
    };
  }

  static getQueueLength(): number {
    const result = this.getQueueLength.get() as { count: number };
    return result.count;
  }
}