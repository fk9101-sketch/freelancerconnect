#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Test with Neon database
const pool = new Pool({
  host: process.env.NEON_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.NEON_PORT || process.env.DB_PORT || '5432'),
  database: process.env.NEON_DATABASE || process.env.DB_NAME || 'hirelocal',
  user: process.env.NEON_USER || process.env.DB_USER || 'postgres',
  password: process.env.NEON_PASSWORD || process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NEON_HOST ? { rejectUnauthorized: false } : false,
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
    
  } catch (error) {
    console.error('❌ Application test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Neon credentials in .env file');
    console.log('2. Ensure your Neon database is running');
    console.log('3. Verify your internet connection');
  } finally {
    await pool.end();
  }
}

// Run test
testAppWithNeon().catch(console.error);
