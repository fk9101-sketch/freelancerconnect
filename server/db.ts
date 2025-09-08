import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug environment variables
console.log('🔍 Environment variables loaded:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? 'Set' : 'Not set');
console.log('NEON_HOST:', process.env.NEON_HOST || 'Not set');
console.log('NEON_DATABASE:', process.env.NEON_DATABASE || 'Not set');
console.log('NEON_USER:', process.env.NEON_USER || 'Not set');

// Create NeonTech PostgreSQL database connection (PRODUCTION ONLY)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for NeonTech
});

const db = drizzle(pool, { schema });

// Test NeonTech database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing NeonTech PostgreSQL connection...');
    console.log(`Using connection string: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`Using Neon URL: ${process.env.NEON_DATABASE_URL ? 'Yes' : 'No'}`);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ NeonTech PostgreSQL database connection successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    console.log(`PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test if we can query the users table
    const tableResult = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Users table accessible, count: ${tableResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ NeonTech PostgreSQL database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Verify your NeonTech database credentials');
    console.log('3. Ensure the database is accessible');
    console.log('4. Check if the database schema is properly set up');
    console.log('5. Verify SSL connection is enabled');
  }
};

// Test connection on startup
testConnection();

export { db, pool };