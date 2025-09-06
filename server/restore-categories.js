import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function restoreCategories(backupFile) {
  const client = await pool.connect();
  
  try {
    console.log(`🔄 Restoring categories from: ${backupFile}`);
    
    // Read backup file
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📦 Backup timestamp: ${backupData.timestamp}`);
    console.log(`📊 Backup contains:`);
    console.log(`   • Categories: ${backupData.summary.totalCategories}`);
    console.log(`   • Freelancer Profiles: ${backupData.summary.totalFreelancerProfiles}`);
    console.log(`   • Leads: ${backupData.summary.totalLeads}`);
    console.log(`   • Subscriptions: ${backupData.summary.totalSubscriptions}`);
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Clear current categories and related data
    console.log('🗑️  Clearing current categories...');
    await client.query('DELETE FROM subscriptions WHERE category_id IS NOT NULL');
    await client.query('DELETE FROM leads WHERE category_id IS NOT NULL');
    await client.query('DELETE FROM freelancer_profiles WHERE category_id IS NOT NULL');
    await client.query('DELETE FROM categories');
    
    // Step 2: Restore categories
    console.log('🔄 Restoring categories...');
    for (const category of backupData.categories) {
      await client.query(
        'INSERT INTO categories (id, name, icon, color, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [category.id, category.name, category.icon, category.color, category.is_active, category.created_at]
      );
    }
    console.log(`✅ Restored ${backupData.categories.length} categories`);
    
    // Step 3: Restore freelancer profiles
    console.log('🔄 Restoring freelancer profiles...');
    for (const profile of backupData.freelancerProfiles) {
      await client.query(
        'UPDATE freelancer_profiles SET category_id = $1 WHERE id = $2',
        [profile.category_id, profile.id]
      );
    }
    console.log(`✅ Restored ${backupData.freelancerProfiles.length} freelancer profile references`);
    
    // Step 4: Restore leads
    console.log('🔄 Restoring leads...');
    for (const lead of backupData.leads) {
      await client.query(
        'UPDATE leads SET category_id = $1 WHERE id = $2',
        [lead.category_id, lead.id]
      );
    }
    console.log(`✅ Restored ${backupData.leads.length} lead references`);
    
    // Step 5: Restore subscriptions
    console.log('🔄 Restoring subscriptions...');
    for (const subscription of backupData.subscriptions) {
      await client.query(
        'UPDATE subscriptions SET category_id = $1 WHERE id = $2',
        [subscription.category_id, subscription.id]
      );
    }
    console.log(`✅ Restored ${backupData.subscriptions.length} subscription references`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Verification
    const { rows: finalCategories } = await client.query(
      'SELECT id, name, icon, color FROM categories ORDER BY name'
    );
    
    console.log(`\n📊 Restored ${finalCategories.length} categories:`);
    finalCategories.forEach(category => {
      console.log(`   • ${category.name} ${category.icon} (ID: ${category.id})`);
    });
    
    console.log('\n✅ Categories restore completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during restore:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Please provide a backup file path as an argument');
  console.log('Usage: node restore-categories.js <backup-file-path>');
  console.log('Example: node restore-categories.js ./backups/categories-backup-1234567890.json');
  process.exit(1);
}

// Run the restore
restoreCategories(backupFile)
  .then(() => {
    console.log('🎉 Categories restore completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Restore failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
