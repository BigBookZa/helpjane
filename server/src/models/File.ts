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
  static getRecentFiles(userId: number, limit: number): FileRecord[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM files 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      const files = stmt.all(userId, limit) as any[];
      return files.map(this.parseFile);
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  }

  static getAverageProcessingTime(userId: number): string {
    try {
      const stmt = db.prepare(`
        SELECT AVG(processing_time) as avg_time 
        FROM files 
        WHERE user_id = ? AND status = 'completed' AND processing_time IS NOT NULL
      `);
      const result = stmt.get(userId) as { avg_time: number | null };
      if (!result || !result.avg_time) return '0s';
      return `${result.avg_time.toFixed(1)}s`;
    } catch (error) {
      console.error('Error getting average processing time:', error);
      return '0s';
    }
  }

  static getSuccessRate(userId: number): number {
    try {
      const stmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM files 
        WHERE user_id = ?
      `);
      const result = stmt.get(userId) as { total: number; completed: number };
      if (!result || result.total === 0) return 0;
      return (result.completed / result.total) * 100;
    } catch (error) {
      console.error('Error getting success rate:', error);
      return 0;
    }
  }

  static getErrorRate(userId: number): number {
    try {
      const stmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM files 
        WHERE user_id = ?
      `);
      const result = stmt.get(userId) as { total: number; errors: number };
      if (!result || result.total === 0) return 0;
      return (result.errors / result.total) * 100;
    } catch (error) {
      console.error('Error getting error rate:', error);
      return 0;
    }
  }

  static getRecentActivity(userId: number, limit: number): any[] {
    try {
      const stmt = db.prepare(`
        SELECT 
          f.filename,
          f.status,
          f.created_at,
          f.processed_at,
          p.name as project_name
        FROM files f
        LEFT JOIN projects p ON f.project_id = p.id
        WHERE f.user_id = ?
        ORDER BY f.updated_at DESC
        LIMIT ?
      `);
      return stmt.all(userId, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  static getDatabaseSize(): number {
    try {
      // SQLite doesn't have a direct way to get database size
      // This is a placeholder implementation
      return 0;
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  }

  static getTotalRecords(): number {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM files');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting total records:', error);
      return 0;
    }
  }

  static getTotalFileCount(userId: number): number {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ?');
      const result = stmt.get(userId) as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting total file count:', error);
      return 0;
    }
  }

  static getTotalFileSize(userId: number): number {
    try {
      const stmt = db.prepare('SELECT SUM(file_size) as total FROM files WHERE user_id = ?');
      const result = stmt.get(userId) as { total: number | null };
      return result.total || 0;
    } catch (error) {
      console.error('Error getting total file size:', error);
      return 0;
    }
  }

  static getStorageUsage(userId: number): any {
    try {
      const used = this.getTotalFileSize(userId);
      const available = 1024 * 1024 * 1024 * 10; // 10GB
      return {
        used,
        available,
        percentage: available > 0 ? (used / available) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, available: 1024 * 1024 * 1024 * 10, percentage: 0 };
    }
  }

  static getProcessingThroughput(userId: number): number {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM files 
        WHERE user_id = ? AND status = 'completed' 
        AND processed_at > datetime('now', '-1 hour')
      `);
      const result = stmt.get(userId) as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting processing throughput:', error);
      return 0;
    }
  }

  private static parseFile(file: any): FileRecord {
    try {
      return {
        ...file,
        keywords: file.keywords ? JSON.parse(file.keywords) : [],
        keys_adobe: file.keys_adobe ? JSON.parse(file.keys_adobe) : [],
        tags: file.tags ? JSON.parse(file.tags) : []
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        ...file,
        keywords: [],
        keys_adobe: [],
        tags: []
      };
    }
  }
}