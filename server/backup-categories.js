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

async function backupCategories() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Creating categories backup...');
    
    // Get all categories
    const { rows: categories } = await client.query(
      'SELECT id, name, icon, color, is_active, created_at FROM categories ORDER BY name'
    );
    
    // Get all freelancer profiles with category references
    const { rows: freelancerProfiles } = await client.query(
      'SELECT id, user_id, category_id FROM freelancer_profiles'
    );
    
    // Get all leads with category references
    const { rows: leads } = await client.query(
      'SELECT id, customer_id, category_id FROM leads'
    );
    
    // Get all subscriptions with category references
    const { rows: subscriptions } = await client.query(
      'SELECT id, freelancer_id, category_id FROM subscriptions'
    );
    
    const backup = {
      timestamp: new Date().toISOString(),
      categories: categories,
      freelancerProfiles: freelancerProfiles,
      leads: leads,
      subscriptions: subscriptions,
      summary: {
        totalCategories: categories.length,
        totalFreelancerProfiles: freelancerProfiles.length,
        totalLeads: leads.length,
        totalSubscriptions: subscriptions.length
      }
    };
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Save backup to file
    const backupFile = path.join(backupDir, `categories-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`📊 Backup summary:`);
    console.log(`   • Categories: ${backup.summary.totalCategories}`);
    console.log(`   • Freelancer Profiles: ${backup.summary.totalFreelancerProfiles}`);
    console.log(`   • Leads: ${backup.summary.totalLeads}`);
    console.log(`   • Subscriptions: ${backup.summary.totalSubscriptions}`);
    
    // Show current categories
    console.log('\n📋 Current categories:');
    categories.forEach(category => {
      console.log(`   • ${category.name} ${category.icon} (ID: ${category.id})`);
    });
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the backup
backupCategories()
  .then(() => {
    console.log('\n🎉 Backup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
