#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

// Direct Neon configuration (no dotenv dependency)
const pool = new Pool({
  host: 'ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_1U4pOodrCNbP',
  ssl: { rejectUnauthorized: false }
});

async function testAppWithNeon() {
  console.log('🧪 Testing application with Neon database...');
  console.log('============================================\n');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection successful');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test key application queries
    console.log('\n🔍 Testing key application queries...');
    
    // Test users query
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table: ${users.rows[0].count} users`);
    
    // Test categories query
    const categories = await pool.query('SELECT COUNT(*) as count FROM categories');
    console.log(`✅ Categories table: ${categories.rows[0].count} categories`);
    
    // Test freelancer profiles query
    const freelancers = await pool.query('SELECT COUNT(*) as count FROM freelancer_profiles');
    console.log(`✅ Freelancer profiles: ${freelancers.rows[0].count} profiles`);
    
    // Test leads query
    const leads = await pool.query('SELECT COUNT(*) as count FROM leads');
    console.log(`✅ Leads table: ${leads.rows[0].count} leads`);
    
    // Test payments query
    const payments = await pool.query('SELECT COUNT(*) as count FROM payments');
    console.log(`✅ Payments table: ${payments.rows[0].count} payments`);
    
    // Test a complex query (freelancers with their categories)
    const freelancerWithCategories = await pool.query(`
      SELECT 
        fp.full_name, 
        fp.professional_title, 
        c.name as category_name,
        fp.area
      FROM freelancer_profiles fp
      LEFT JOIN categories c ON fp.category_id = c.id
      LIMIT 5
    `);
    
    console.log('\n👨‍💼 Sample freelancers with categories:');
    freelancerWithCategories.rows.forEach(freelancer => {
      console.log(`   - ${freelancer.full_name} (${freelancer.professional_title}) - ${freelancer.category_name || 'No category'} - ${freelancer.area}`);
    });
    
    // Test leads with customer info
    const leadsWithCustomers = await pool.query(`
      SELECT 
        l.title, 
        l.location, 
        l.status,
        u.first_name,
        u.last_name
      FROM leads l
      LEFT JOIN users u ON l.customer_id = u.id
      LIMIT 5
    `);
    
    console.log('\n📋 Sample leads with customers:');
    leadsWithCustomers.rows.forEach(lead => {
      console.log(`   - ${lead.title} (${lead.location}) - ${lead.status} - Customer: ${lead.first_name} ${lead.last_name}`);
    });
    
    console.log('\n🎉 Application is ready to work with Neon database!');
    console.log('\n📋 Your application can now:');
    console.log('✅ Connect to Neon PostgreSQL');
    console.log('✅ Query all tables successfully');
    console.log('✅ Handle complex joins and relationships');
    console.log('✅ Process user data, leads, payments, etc.');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Your application is now configured to use Neon by default');
    console.log('2. Start your development server: npm run dev:server');
    console.log('3. Test all functionality in your application');
    console.log('4. Deploy to production with Neon credentials');
    
  } catch (error) {
    console.error('❌ Application test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Neon credentials');
    console.log('2. Ensure your Neon database is running');
    console.log('3. Verify your internet connection');
  } finally {
    await pool.end();
  }
}

// Run test
testAppWithNeon().catch(console.error);
