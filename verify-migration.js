#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

// Neon database configuration
const NEON_DB_CONFIG = {
  host: 'ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_1U4pOodrCNbP',
  ssl: { rejectUnauthorized: false }
};

const neonPool = new Pool(NEON_DB_CONFIG);

async function verifyMigration() {
  console.log('🔍 Verifying Neon database migration...');
  console.log('=====================================\n');
  
  try {
    // Test connection
    const result = await neonPool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Neon database connection successful');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Check all tables and their row counts
    const tables = [
      'users', 'categories', 'areas', 'freelancer_profiles', 
      'leads', 'subscriptions', 'payments', 'inquiries', 
      'reviews', 'lead_interests', 'freelancer_lead_interactions', 
      'notifications', 'sessions'
    ];
    
    console.log('📊 Table Data Summary:');
    console.log('=====================');
    
    let totalRows = 0;
    for (const table of tables) {
      try {
        const countResult = await neonPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const rowCount = parseInt(countResult.rows[0].count);
        totalRows += rowCount;
        console.log(`${table.padEnd(25)}: ${rowCount.toString().padStart(6)} rows`);
      } catch (error) {
        console.log(`${table.padEnd(25)}: Error - ${error.message}`);
      }
    }
    
    console.log('='.repeat(35));
    console.log(`Total rows across all tables: ${totalRows}`);
    
    // Sample data verification
    console.log('\n🔍 Sample Data Verification:');
    console.log('============================');
    
    // Check users
    const users = await neonPool.query('SELECT id, email, first_name, last_name, role FROM users LIMIT 3');
    console.log('\n👥 Sample Users:');
    users.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });
    
    // Check categories
    const categories = await neonPool.query('SELECT name, icon, color FROM categories LIMIT 5');
    console.log('\n📂 Sample Categories:');
    categories.rows.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.icon}) - ${cat.color}`);
    });
    
    // Check freelancer profiles
    const freelancers = await neonPool.query('SELECT full_name, professional_title, area FROM freelancer_profiles LIMIT 3');
    console.log('\n👨‍💼 Sample Freelancers:');
    freelancers.rows.forEach(freelancer => {
      console.log(`   - ${freelancer.full_name} - ${freelancer.professional_title} (${freelancer.area})`);
    });
    
    // Check leads
    const leads = await neonPool.query('SELECT title, location, status FROM leads LIMIT 3');
    console.log('\n📋 Sample Leads:');
    leads.rows.forEach(lead => {
      console.log(`   - ${lead.title} (${lead.location}) - ${lead.status}`);
    });
    
    // Check payments
    const payments = await neonPool.query('SELECT amount, currency, status FROM payments LIMIT 3');
    console.log('\n💳 Sample Payments:');
    payments.rows.forEach(payment => {
      console.log(`   - ₹${payment.amount} ${payment.currency} - ${payment.status}`);
    });
    
    console.log('\n🎉 Migration verification completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your application to use Neon database');
    console.log('2. Test all functionality with the new database');
    console.log('3. Update production environment variables');
    console.log('4. Deploy your application');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await neonPool.end();
  }
}

// Run verification
verifyMigration().catch(console.error);
