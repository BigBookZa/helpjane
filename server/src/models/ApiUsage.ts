import db from '../database/connection';

export interface ApiUsageRecord {
  id: number;
  user_id?: number;
  api_provider: string;
  endpoint?: string;
  tokens_used: number;
  cost: number;
  request_data?: string;
  response_data?: string;
  processing_time?: number;
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  created_at: string;
}

export class ApiUsageModel {
  static getDailyUsage(userId: number, date?: string): {
    total_tokens: number;
    total_requests: number;
    total_cost: number;
  } {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const stmt = db.prepare(`
        SELECT 
          SUM(tokens_used) as total_tokens,
          COUNT(*) as total_requests,
          SUM(cost) as total_cost
        FROM api_usage 
        WHERE user_id = ? AND DATE(created_at) = ?
      `);
      const result = stmt.get(userId, targetDate) as any;
      
      return {
        total_tokens: result?.total_tokens || 0,
        total_requests: result?.total_requests || 0,
        total_cost: result?.total_cost || 0
      };
    } catch (error) {
      console.error('Error getting daily usage:', error);
      return {
        total_tokens: 0,
        total_requests: 0,
        total_cost: 0
      };
    }
  }

  static getMonthlyUsage(userId: number, month?: string): {
    total_tokens: number;
    total_requests: number;
    total_cost: number;
  } {
    try {
      const targetMonth = month || new Date().toISOString().substring(0, 7);
      const stmt = db.prepare(`
        SELECT 
          SUM(tokens_used) as total_tokens,
          COUNT(*) as total_requests,
          SUM(cost) as total_cost
        FROM api_usage 
        WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      `);
      const result = stmt.get(userId, targetMonth) as any;
      
      return {
        total_tokens: result?.total_tokens || 0,
        total_requests: result?.total_requests || 0,
        total_cost: result?.total_cost || 0
      };
    } catch (error) {
      console.error('Error getting monthly usage:', error);
      return {
        total_tokens: 0,
        total_requests: 0,
        total_cost: 0
      };
    }
  }

  static getErrorRate(userId: number): number {
    try {
      const stmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM api_usage 
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
}