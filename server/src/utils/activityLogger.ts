import db from '../database/connection';

export interface ActivityLogEntry {
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class ActivityLogger {
  private static insertLog = db.prepare(`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  static log(
    userId: number | undefined,
    action: string,
    entityType?: string,
    entityId?: number,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): void {
    try {
      this.insertLog.run(
        userId || null,
        action,
        entityType || null,
        entityId || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static getRecentActivity(userId?: number, limit = 50): any[] {
    const query = userId 
      ? db.prepare(`
          SELECT * FROM activity_logs 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT ?
        `)
      : db.prepare(`
          SELECT * FROM activity_logs 
          ORDER BY created_at DESC 
          LIMIT ?
        `);

    const params = userId ? [userId, limit] : [limit];
    return query.all(...params);
  }

  static getActivityByEntity(entityType: string, entityId: number): any[] {
    const query = db.prepare(`
      SELECT * FROM activity_logs 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC
    `);

    return query.all(entityType, entityId);
  }
}