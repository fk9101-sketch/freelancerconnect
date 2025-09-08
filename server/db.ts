import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Create PostgreSQL database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing PostgreSQL connection...');
    console.log(`Using connection string: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`Using Neon URL: ${process.env.NEON_DATABASE_URL ? 'Yes' : 'No'}`);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ PostgreSQL database connection successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    console.log(`PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test if we can query the users table
    const tableResult = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Users table accessible, count: ${tableResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ PostgreSQL database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Verify your Neon database credentials');
    console.log('3. Ensure the database is accessible');
    console.log('4. Check if the database schema is properly set up');
  }
};

// Test connection on startup
testConnection();

export { db, pool };