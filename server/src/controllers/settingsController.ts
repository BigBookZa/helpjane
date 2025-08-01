import { Request, Response } from 'express';
import { SettingsModel } from '../models/Settings';
import { ActivityLogger } from '../utils/activityLogger';

// Определяем интерфейс для настроек
interface Settings {
  openai_api_key?: string;
  telegram_bot_token?: string;
  yandex_disk_token?: string;
  max_tokens?: number;
  temperature?: number;
  [key: string]: any;
}

// Интерфейс для безопасных настроек (без чувствительных данных)
interface SafeSettings extends Settings {
  // Все свойства опциональны
}

// Интерфейс для ошибок API
interface ApiError {
  error?: {
    message: string;
  };
  description?: string;
  message?: string;
}

export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    let settings: Settings = {};
    
    try {
      settings = SettingsModel.getUserSettings(userId);
    } catch (error) {
      console.warn('Failed to get user settings, using defaults:', error);
      settings = SettingsModel.getGlobalSettings();
    }
    
    // Don't send sensitive data to frontend
    const safeSettings: SafeSettings = { ...settings };
    if (safeSettings.openai_api_key) {
      safeSettings.openai_api_key = '***' + safeSettings.openai_api_key.slice(-4);
    }
    if (safeSettings.telegram_bot_token) {
      safeSettings.telegram_bot_token = '***' + safeSettings.telegram_bot_token.slice(-4);
    }
    if (safeSettings.yandex_disk_token) {
      safeSettings.yandex_disk_token = '***' + safeSettings.yandex_disk_token.slice(-4);
    }

    res.json(safeSettings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updates: Settings = req.body;

    // Validate critical settings
    if (updates.openai_api_key && !updates.openai_api_key.startsWith('sk-')) {
      return res.status(400).json({ error: 'Invalid OpenAI API key format' });
    }

    if (updates.max_tokens && (updates.max_tokens < 100 || updates.max_tokens > 4000)) {
      return res.status(400).json({ error: 'Max tokens must be between 100 and 4000' });
    }

    if (updates.temperature && (updates.temperature < 0 || updates.temperature > 2)) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 2' });
    }

    // Update settings
    try {
      SettingsModel.setUserSettings(userId, updates);
    } catch (error) {
      console.error('Failed to update settings:', error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    // Log activity
    try {
      ActivityLogger.log(userId, 'settings_updated', 'settings', null, {
        updatedKeys: Object.keys(updates)
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }

    // Return updated settings (masked)
    const settings: Settings = SettingsModel.getUserSettings(userId);
    const safeSettings: SafeSettings = { ...settings };
    if (safeSettings.openai_api_key) {
      safeSettings.openai_api_key = '***' + safeSettings.openai_api_key.slice(-4);
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings: safeSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const testApiConnection = async (req: Request, res: Response) => {
  try {
    const { service, config } = req.body;
    const userId = req.user!.id;

    let result = { success: false, message: '' };

    switch (service) {
      case 'openai':
        result = await testOpenAIConnection(config.apiKey);
        break;
      case 'telegram':
        result = await testTelegramConnection(config.token, config.chatId);
        break;
      case 'yandex':
        result = await testYandexConnection(config.token);
        break;
      default:
        return res.status(400).json({ error: 'Unknown service' });
    }

    // Log test activity
    try {
      ActivityLogger.log(userId, `${service}_test`, 'api', null, {
        service,
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.warn('Failed to log test activity:', error);
    }

    res.json(result);
  } catch (error) {
    console.error('API test error:', error);
    res.status(500).json({ 
      error: 'Failed to test API connection',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

const testOpenAIConnection = async (apiKey: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API connection successful' };
    } else {
      const error = await response.json() as ApiError;
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  } catch (error) {
    return { success: false, message: 'Failed to connect to OpenAI API' };
  }
};

const testTelegramConnection = async (token: string, chatId: string) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🤖 Helper for Jane test message - connection successful!'
      })
    });

    if (response.ok) {
      return { success: true, message: 'Telegram bot connection successful' };
    } else {
      const error = await response.json() as ApiError;
      return { success: false, message: error.description || 'Invalid bot token or chat ID' };
    }
  } catch (error) {
    return { success: false, message: 'Failed to connect to Telegram API' };
  }
};

const testYandexConnection = async (token: string) => {
  try {
    const response = await fetch('https://cloud-api.yandex.net/v1/disk', {
      headers: {
        'Authorization': `OAuth ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'Yandex Disk connection successful' };
    } else {
      return { success: false, message: 'Invalid Yandex Disk token' };
    }
  } catch (error) {
    return { success: false, message: 'Failed to connect to Yandex Disk API' };
  }
};

export const exportSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const settings: Settings = SettingsModel.getUserSettings(userId);

    // Remove sensitive data from export
    const exportData: Settings = { ...settings };
    delete exportData.openai_api_key;
    delete exportData.telegram_bot_token;
    delete exportData.yandex_disk_token;

    const exportObject = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: exportData
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=helper-for-jane-settings.json');
    res.json(exportObject);
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({ 
      error: 'Failed to export settings',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const importSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const importData = req.body;

    if (!importData.settings) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    // Validate and import settings
    SettingsModel.setUserSettings(userId, importData.settings);

    ActivityLogger.log(userId, 'settings_imported', 'settings', null, {
      importedKeys: Object.keys(importData.settings)
    });

    res.json({ message: 'Settings imported successfully' });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({ 
      error: 'Failed to import settings',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};