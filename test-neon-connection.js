#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Neon database configuration
const NEON_DB_CONFIG = {
  host: process.env.NEON_HOST,
  port: parseInt(process.env.NEON_PORT || '5432'),
  database: process.env.NEON_DATABASE,
  user: process.env.NEON_USER,
  password: process.env.NEON_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function testNeonConnection() {
  console.log('🔄 Testing Neon PostgreSQL connection...');
  console.log(`Host: ${NEON_DB_CONFIG.host}`);
  console.log(`Port: ${NEON_DB_CONFIG.port}`);
  console.log(`Database: ${NEON_DB_CONFIG.database}`);
  console.log(`User: ${NEON_DB_CONFIG.user}`);
  console.log(`SSL: ${NEON_DB_CONFIG.ssl ? 'Enabled' : 'Disabled'}\n`);
  
  const pool = new Pool(NEON_DB_CONFIG);
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Neon PostgreSQL connection successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    console.log(`PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test database operations
    console.log('\n🔄 Testing database operations...');
    
    // Check if we can create a test table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Test table creation successful');
    
    // Insert test data
    await pool.query(`
      INSERT INTO test_connection (message) 
      VALUES ('Connection test successful at ' || NOW())
    `);
    console.log('✅ Test data insertion successful');
    
    // Query test data
    const testResult = await pool.query('SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1');
    console.log('✅ Test data query successful');
    console.log(`Test message: ${testResult.rows[0].message}`);
    
    // Clean up test table
    await pool.query('DROP TABLE test_connection');
    console.log('✅ Test table cleanup successful');
    
    console.log('\n🎉 Neon database is ready for migration!');
    
  } catch (error) {
    console.error('❌ Neon PostgreSQL connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your Neon credentials in .env file');
    console.log('2. Ensure your IP is whitelisted in Neon console');
    console.log('3. Verify the database exists in Neon');
    console.log('4. Check your internet connection');
    console.log('5. Ensure SSL is properly configured');
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Host resolution error - check your NEON_HOST');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused - check your NEON_PORT and firewall');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication failed - check your NEON_USER and NEON_PASSWORD');
    } else if (error.message.includes('database')) {
      console.log('\n💡 Database error - check your NEON_DATABASE name');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNeonConnection().catch(console.error);
}

export { testNeonConnection };
