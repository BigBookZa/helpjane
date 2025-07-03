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
  private static getUserSettings = db.prepare(`
    SELECT * FROM settings 
    WHERE (user_id = ? OR is_global = 1)
    ORDER BY is_global ASC, setting_key
  `);

  private static getGlobalSettings = db.prepare(`
    SELECT * FROM settings WHERE is_global = 1
  `);

  private static getSetting = db.prepare(`
    SELECT * FROM settings 
    WHERE setting_key = ? AND (user_id = ? OR is_global = 1)
    ORDER BY is_global ASC
    LIMIT 1
  `);

  private static upsertSetting = db.prepare(`
    INSERT INTO settings (user_id, setting_key, setting_value, setting_type, is_global)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      setting_type = excluded.setting_type,
      updated_at = CURRENT_TIMESTAMP
  `);

  private static deleteSetting = db.prepare(`
    DELETE FROM settings WHERE setting_key = ? AND user_id = ?
  `);

  static getUserSettings(userId: number): Record<string, any> {
    const settings = this.getUserSettings.all(userId) as Setting[];
    return this.parseSettings(settings);
  }

  static getGlobalSettings(): Record<string, any> {
    const settings = this.getGlobalSettings.all() as Setting[];
    return this.parseSettings(settings);
  }

  static getSetting(key: string, userId?: number): any {
    const setting = this.getSetting.get(key, userId || null) as Setting | null;
    if (!setting) return null;

    return this.parseValue(setting.setting_value, setting.setting_type);
  }

  static setSetting(key: string, value: any, type: Setting['setting_type'], userId?: number, isGlobal = false): void {
    const stringValue = this.stringifyValue(value, type);
    
    this.upsertSetting.run(
      isGlobal ? null : userId,
      key,
      stringValue,
      type,
      isGlobal ? 1 : 0
    );
  }

  static setUserSettings(userId: number, settings: Record<string, any>): void {
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const type = this.inferType(value);
        this.setSetting(key, value, type, userId, false);
      }
    });

    transaction();
  }

  static setGlobalSettings(settings: Record<string, any>): void {
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const type = this.inferType(value);
        this.setSetting(key, value, type, undefined, true);
      }
    });

    transaction();
  }

  static deleteSetting(key: string, userId: number): void {
    this.deleteSetting.run(key, userId);
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
  }

  private static stringifyValue(value: any, type: Setting['setting_type']): string {
    switch (type) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value);
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