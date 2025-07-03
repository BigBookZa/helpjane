import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'helper-for-jane.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('temp_store = memory');

// Initialize database schema
export const initializeDatabase = () => {
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    console.log('Database schema initialized successfully');
    
    // Insert default global settings if they don't exist
    insertDefaultSettings();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

const insertDefaultSettings = () => {
  const defaultSettings = [
    { key: 'openai_model', value: 'gpt-4-vision-preview', type: 'string' },
    { key: 'max_tokens', value: '1000', type: 'number' },
    { key: 'temperature', value: '0.7', type: 'number' },
    { key: 'max_file_size', value: '10485760', type: 'number' }, // 10MB
    { key: 'allowed_formats', value: '["jpg","jpeg","png","webp","heic"]', type: 'json' },
    { key: 'concurrent_processing', value: '3', type: 'number' },
    { key: 'queue_check_interval', value: '30', type: 'number' },
    { key: 'max_retries', value: '3', type: 'number' },
    { key: 'retry_delay', value: '60', type: 'number' },
    { key: 'timeout', value: '120', type: 'number' },
    { key: 'default_thumbnail_size', value: 'medium', type: 'string' },
    { key: 'thumbnail_quality', value: '85', type: 'number' },
    { key: 'notifications_enabled', value: 'true', type: 'boolean' },
    { key: 'telegram_notifications', value: 'false', type: 'boolean' },
    { key: 'yandex_storage_enabled', value: 'false', type: 'boolean' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (setting_key, setting_value, setting_type, is_global)
    VALUES (?, ?, ?, 1)
  `);

  const insertMany = db.transaction((settings) => {
    for (const setting of settings) {
      insertSetting.run(setting.key, setting.value, setting.type);
    }
  });

  insertMany(defaultSettings);
};

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;