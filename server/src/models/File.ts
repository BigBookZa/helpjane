import db from '../database/connection';
import fs from 'fs';

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

export interface CreateFileData {
  project_id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  mime_type?: string;
  status?: 'queued' | 'processing' | 'completed' | 'error';
}

export class FileModel {
  private static createFileStmt = db.prepare(`
    INSERT INTO files (
      project_id, user_id, filename, original_filename, file_size, 
      file_path, thumbnail_path, mime_type, status, keywords, keys_adobe, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private static findByIdStmt = db.prepare(`
    SELECT * FROM files WHERE id = ? AND user_id = ?
  `);

  private static findByProjectStmt = db.prepare(`
    SELECT * FROM files WHERE project_id = ? AND user_id = ? 
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `);

  private static updateFileStmt = db.prepare(`
    UPDATE files SET 
      new_name_photo = ?, title_adobe = ?, description = ?, keywords = ?,
      keys_adobe = ?, adobe_category = ?, notes = ?, tags = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  private static deleteFileStmt = db.prepare(`
    DELETE FROM files WHERE id = ? AND user_id = ?
  `);

  private static updateStatusStmt = db.prepare(`
    UPDATE files SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);

  static async create(fileData: CreateFileData): Promise<FileRecord> {
    try {
      const result = this.createFileStmt.run(
        fileData.project_id,
        fileData.user_id,
        fileData.filename,
        fileData.original_filename,
        fileData.file_size,
        fileData.file_path,
        fileData.thumbnail_path || null,
        fileData.mime_type || null,
        fileData.status || 'queued',
        JSON.stringify([]), // keywords
        JSON.stringify([]), // keys_adobe
        JSON.stringify([])  // tags
      );

      const file = this.findByIdStmt.get(result.lastInsertRowid, fileData.user_id) as FileRecord;
      return this.parseFile(file);
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file record');
    }
  }

  static findById(id: number, userId: number): FileRecord | null {
    try {
      const file = this.findByIdStmt.get(id, userId) as FileRecord | null;
      return file ? this.parseFile(file) : null;
    } catch (error) {
      console.error('Error finding file by ID:', error);
      return null;
    }
  }

  static async findByProject(
    projectId: number, 
    options: { page?: number; limit?: number; status?: string } = {}
  ): Promise<FileRecord[]> {
    try {
      const { page = 1, limit = 50, status } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM files 
        WHERE project_id = ?
      `;
      const params: any[] = [projectId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const files = stmt.all(...params) as FileRecord[];
      return files.map(this.parseFile);
    } catch (error) {
      console.error('Error finding files by project:', error);
      return [];
    }
  }

  static async update(id: number, userId: number, updates: Partial<FileRecord>): Promise<FileRecord | null> {
    try {
      const current = this.findById(id, userId);
      if (!current) return null;

      this.updateFileStmt.run(
        updates.new_name_photo || current.new_name_photo || null,
        updates.title_adobe || current.title_adobe || null,
        updates.description || current.description || null,
        JSON.stringify(updates.keywords || current.keywords),
        JSON.stringify(updates.keys_adobe || current.keys_adobe),
        updates.adobe_category || current.adobe_category || null,
        updates.notes || current.notes || null,
        JSON.stringify(updates.tags || current.tags),
        id,
        userId
      );

      return this.findById(id, userId);
    } catch (error) {
      console.error('Error updating file:', error);
      return null;
    }
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    try {
      // Get file info first to clean up files
      const file = this.findById(id, userId);
      if (!file) return false;

      // Delete database record
      const result = this.deleteFileStmt.run(id, userId);
      
      if (result.changes > 0) {
        // Clean up physical files
        try {
          if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
          }
          if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
            fs.unlinkSync(file.thumbnail_path);
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up files:', cleanupError);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static async reprocess(id: number, userId: number): Promise<FileRecord | null> {
    try {
      const file = this.findById(id, userId);
      if (!file) return null;

      this.updateStatusStmt.run('queued', id);
      return this.findById(id, userId);
    } catch (error) {
      console.error('Error reprocessing file:', error);
      return null;
    }
  }

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