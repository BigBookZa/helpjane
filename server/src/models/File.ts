import db from '../database/connection';

export interface FileRecord {
  id: number;
  project_id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  new_name_photo?: string;
  title_adobe?: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  mime_type?: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  description?: string;
  keywords: string[];
  prompt?: string;
  keys_adobe: string[];
  adobe_category?: string;
  notes?: string;
  tags: string[];
  attempts: number;
  processing_time?: number;
  error_message?: string;
  ai_response?: string;
  tokens_used: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export class FileModel {
  private static getRecentFiles = db.prepare(`
    SELECT * FROM files 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);

  private static getAverageProcessingTime = db.prepare(`
    SELECT AVG(processing_time) as avg_time 
    FROM files 
    WHERE user_id = ? AND status = 'completed' AND processing_time IS NOT NULL
  `);

  private static getSuccessRate = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM files 
    WHERE user_id = ?
  `);

  private static getErrorRate = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
    FROM files 
    WHERE user_id = ?
  `);

  private static getRecentActivity = db.prepare(`
    SELECT 
      f.filename,
      f.status,
      f.created_at,
      f.processed_at,
      p.name as project_name
    FROM files f
    JOIN projects p ON f.project_id = p.id
    WHERE f.user_id = ?
    ORDER BY f.updated_at DESC
    LIMIT ?
  `);

  static getRecentFiles(userId: number, limit: number): FileRecord[] {
    const files = this.getRecentFiles.all(userId, limit) as FileRecord[];
    return files.map(this.parseFile);
  }

  static getAverageProcessingTime(userId: number): string {
    const result = this.getAverageProcessingTime.get(userId) as { avg_time: number | null };
    if (!result.avg_time) return '0s';
    return `${result.avg_time.toFixed(1)}s`;
  }

  static getSuccessRate(userId: number): number {
    const result = this.getSuccessRate.get(userId) as { total: number; completed: number };
    if (result.total === 0) return 0;
    return (result.completed / result.total) * 100;
  }

  static getErrorRate(userId: number): number {
    const result = this.getErrorRate.get(userId) as { total: number; errors: number };
    if (result.total === 0) return 0;
    return (result.errors / result.total) * 100;
  }

  static getRecentActivity(userId: number, limit: number): any[] {
    return this.getRecentActivity.all(userId, limit);
  }

  static getDatabaseSize(): number {
    // This is a simplified implementation
    return 0;
  }

  static getTotalRecords(): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };
    return result.count;
  }

  static getTotalFileCount(userId: number): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ?').get(userId) as { count: number };
    return result.count;
  }

  static getTotalFileSize(userId: number): number {
    const result = db.prepare('SELECT SUM(file_size) as total FROM files WHERE user_id = ?').get(userId) as { total: number | null };
    return result.total || 0;
  }

  static getStorageUsage(userId: number): any {
    return {
      used: this.getTotalFileSize(userId),
      available: 1024 * 1024 * 1024 * 10, // 10GB
      percentage: 0
    };
  }

  static getProcessingThroughput(userId: number): number {
    // Files processed in the last hour
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM files 
      WHERE user_id = ? AND status = 'completed' 
      AND processed_at > datetime('now', '-1 hour')
    `).get(userId) as { count: number };
    
    return result.count;
  }

  private static parseFile(file: FileRecord): FileRecord {
    return {
      ...file,
      keywords: JSON.parse(file.keywords as any) || [],
      keys_adobe: JSON.parse(file.keys_adobe as any) || [],
      tags: JSON.parse(file.tags as any) || []
    };
  }
}