import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Create PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing PostgreSQL connection...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || '5000'}`);
    console.log(`Database: ${process.env.DB_NAME || 'hirelocal'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ PostgreSQL database connection successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    console.log(`PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test if database exists
    const dbResult = await pool.query("SELECT datname FROM pg_database WHERE datname = 'hirelocal'");
    if (dbResult.rows.length > 0) {
      console.log('✅ Database "hirelocal" exists');
    } else {
      console.log('❌ Database "hirelocal" does not exist. Please create it first.');
      console.log('Run: CREATE DATABASE hirelocal;');
    }
    
  } catch (error) {
    console.error('❌ PostgreSQL database connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if the database "hirelocal" exists');
    console.log('3. Verify your credentials');
    console.log('4. Ensure PostgreSQL is running on port 5000');
  }
};

// Test connection on startup
testConnection();

export { db, pool };