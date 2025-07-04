import { initializeDatabase } from './connection';
import { logger } from '../utils/logger';

const runMigration = () => {
  try {
    console.log('🔄 Starting database migration...');
    
    const success = initializeDatabase();
    
    if (success) {
      console.log('✅ Database migration completed successfully');
      logger.info('Database migration completed successfully');
    } else {
      console.error('❌ Database migration failed');
      logger.error('Database migration failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    logger.error('Migration error:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };