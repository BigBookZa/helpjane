import db from './connection';
import { UserModel } from '../models/User';
import { SettingsModel } from '../models/Settings';
import { logger } from '../utils/logger';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create demo admin user
    const adminExists = UserModel.findByEmail('admin@example.com');
    if (!adminExists) {
      const admin = await UserModel.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Created admin user:', admin.email);
    }

    // Create demo regular user
    const userExists = UserModel.findByEmail('demo@example.com');
    if (!userExists) {
      const user = await UserModel.create({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'demo123',
        role: 'user'
      });
      console.log('✅ Created demo user:', user.email);
    }

    // Insert default templates
    const defaultTemplates = [
      {
        name: 'E-commerce Product Description',
        description: 'Generate detailed product descriptions for online stores',
        category: 'ecommerce',
        prompt: 'Analyze this product image ({filename}) and provide:\n\n1. Product Name: [Descriptive name based on what you see]\n2. Detailed Description: [150-200 words describing the product, materials, features, and benefits]\n3. Key Features: [5-7 bullet points of main features]\n4. Target Audience: [Who would buy this product]\n5. SEO Keywords: [10-15 relevant keywords for search optimization]\n\nFormat the response clearly with each section labeled.',
        variables: JSON.stringify(['{filename}']),
        is_global: 1, // Изменено с true на 1
        is_default: 1 // Изменено с true на 1
      },
      {
        name: 'Stock Photography Keywords',
        description: 'Extract relevant keywords and tags for stock photography',
        category: 'photography',
        prompt: 'Generate comprehensive metadata for this stock photo ({filename}):\n\n1. Title: [Concise, descriptive title under 60 characters]\n2. Description: [Detailed 150-200 word description]\n3. Keywords: [25-30 relevant keywords separated by commas]\n4. Technical Details: [Camera settings, lighting, composition style if visible]\n5. Mood/Emotion: [Emotional tone and atmosphere]\n6. Usage Suggestions: [Potential commercial uses]',
        variables: JSON.stringify(['{filename}']),
        is_global: 1, // Изменено с true на 1
        is_default: 0 // Изменено с false на 0
      },
      {
        name: 'Real Estate Property Analysis',
        description: 'Create compelling property descriptions from photos',
        category: 'realestate',
        prompt: 'Analyze this property image ({filename}) for real estate listing:\n\n1. Property Type: [House/Apartment/Commercial/Land]\n2. Architectural Style: [Modern/Traditional/Contemporary/etc.]\n3. Key Features: [Notable architectural and design elements]\n4. Room/Space Analysis: [What room or area is shown, key features]\n5. Condition Assessment: [New/Renovated/Well-maintained/etc.]\n6. Marketing Highlights: [What makes this property attractive to buyers]\n7. Suggested Description: [2-3 sentences for listing]',
        variables: JSON.stringify(['{filename}']),
        is_global: 1, // Изменено с true на 1
        is_default: 0 // Изменено с false на 0
      }
    ];

    const insertTemplate = db.prepare(`
      INSERT OR IGNORE INTO templates (name, description, category, prompt, variables, is_global, is_default, usage_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    for (const template of defaultTemplates) {
      insertTemplate.run(
        template.name,
        template.description,
        template.category,
        template.prompt,
        template.variables,
        template.is_global ? 1 : 0, // Преобразование boolean в 0/1
        template.is_default ? 1 : 0 // Преобразование boolean в 0/1
      );
    }

    console.log('✅ Default templates created');
    console.log('🌱 Database seeding completed successfully');
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    logger.error('Database seeding error:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };