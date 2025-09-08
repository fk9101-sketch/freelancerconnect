#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const NEON_DB_CONFIG = {
  host: process.env.NEON_HOST,
  port: parseInt(process.env.NEON_PORT || '5432'),
  database: process.env.NEON_DATABASE,
  user: process.env.NEON_USER,
  password: process.env.NEON_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

console.log('Testing Neon connection...');
console.log('Host:', NEON_DB_CONFIG.host);
console.log('Database:', NEON_DB_CONFIG.database);
console.log('User:', NEON_DB_CONFIG.user);

const pool = new Pool(NEON_DB_CONFIG);

try {
  const result = await pool.query('SELECT NOW() as current_time, version() as version');
  console.log('✅ Neon connection successful!');
  console.log('Time:', result.rows[0].current_time);
  console.log('Version:', result.rows[0].version);
  
  // Check existing tables
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('\nExisting tables in Neon:');
  tablesResult.rows.forEach(row => {
    console.log('-', row.table_name);
  });
  
} catch (error) {
  console.error('❌ Connection failed:', error.message);
} finally {
  await pool.end();
}
