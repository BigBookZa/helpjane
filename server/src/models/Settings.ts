import db from '../database/connection';

export interface Setting {
  id: number;
  user_id?: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export class SettingsModel {
  static getUserSettings(userId: number): Record<string, any> {
    try {
      const stmt = db.prepare(`
        SELECT * FROM settings 
        WHERE (user_id = ? OR is_global = 1)
        ORDER BY is_global ASC, setting_key
      `);
      const settings = stmt.all(userId) as Setting[];
      return this.parseSettings(settings);
    } catch (error) {
      console.error('Error getting user settings:', error);
      return this.getGlobalSettings();
    }
  }

  static getGlobalSettings(): Record<string, any> {
    try {
      const stmt = db.prepare(`SELECT * FROM settings WHERE is_global = 1`);
      const settings = stmt.all() as Setting[];
      return this.parseSettings(settings);
    } catch (error) {
      console.error('Error getting global settings:', error);
      return {};
    }
  }

  static getSetting(key: string, userId?: number): any {
    try {
      const stmt = db.prepare(`
        SELECT * FROM settings 
        WHERE setting_key = ? AND (user_id = ? OR is_global = 1)
        ORDER BY is_global ASC
        LIMIT 1
      `);
      const setting = stmt.get(key, userId || null) as Setting | null;
      if (!setting) return null;

      return this.parseValue(setting.setting_value, setting.setting_type);
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  static setSetting(key: string, value: any, type: Setting['setting_type'], userId?: number, isGlobal = false): void {
    try {
      const stringValue = this.stringifyValue(value, type);
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (user_id, setting_key, setting_value, setting_type, is_global, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(
        isGlobal ? null : userId,
        key,
        stringValue,
        type,
        isGlobal ? 1 : 0
      );
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  static setUserSettings(userId: number, settings: Record<string, any>): void {
    try {
      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          const type = this.inferType(value);
          this.setSetting(key, value, type, userId, false);
        }
      });

      transaction();
    } catch (error) {
      console.error('Error setting user settings:', error);
      throw error;
    }
  }

  static setGlobalSettings(settings: Record<string, any>): void {
    try {
      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          const type = this.inferType(value);
          this.setSetting(key, value, type, undefined, true);
        }
      });

      transaction();
    } catch (error) {
      console.error('Error setting global settings:', error);
      throw error;
    }
  }

  static deleteSetting(key: string, userId: number): void {
    try {
      const stmt = db.prepare(`DELETE FROM settings WHERE setting_key = ? AND user_id = ?`);
      stmt.run(key, userId);
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  private static parseSettings(settings: Setting[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const setting of settings) {
      // User settings override global settings
      if (!result.hasOwnProperty(setting.setting_key)) {
        result[setting.setting_key] = this.parseValue(setting.setting_value, setting.setting_type);
      }
    }

    return result;
  }

  private static parseValue(value: string, type: Setting['setting_type']): any {
    try {
      switch (type) {
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true';
        case 'json':
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        default:
          return value;
      }
    } catch (error) {
      console.error('Error parsing value:', error);
      return null;
    }
  }

  private static stringifyValue(value: any, type: Setting['setting_type']): string {
    try {
      switch (type) {
        case 'json':
          return JSON.stringify(value);
        case 'boolean':
          return value ? 'true' : 'false';
        default:
          return String(value);
      }
    } catch (error) {
      console.error('Error stringifying value:', error);
      return '';
    }
  }

  private static inferType(value: any): Setting['setting_type'] {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  // Specific getters for common settings
  static getOpenAIKey(userId?: number): string | null {
    return this.getSetting('openai_api_key', userId);
  }

  static getTelegramConfig(userId?: number): { token: string; chatId: string } | null {
    const token = this.getSetting('telegram_bot_token', userId);
    const chatId = this.getSetting('telegram_chat_id', userId);
    
    if (!token || !chatId) return null;
    
    return { token, chatId };
  }

  static getYandexConfig(userId?: number): { token: string; baseFolder: string } | null {
    const token = this.getSetting('yandex_disk_token', userId);
    const baseFolder = this.getSetting('yandex_base_folder', userId) || '/helper-for-jane';
    
    if (!token) return null;
    
    return { token, baseFolder };
  }
}