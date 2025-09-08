#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configurations
const LOCAL_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
};

const NEON_DB_CONFIG = {
  host: process.env.NEON_HOST,
  port: parseInt(process.env.NEON_PORT || '5432'),
  database: process.env.NEON_DATABASE,
  user: process.env.NEON_USER,
  password: process.env.NEON_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// Create database connections
const localPool = new Pool(LOCAL_DB_CONFIG);
const neonPool = new Pool(NEON_DB_CONFIG);

// Tables to verify
const TABLES = [
  'sessions',
  'users',
  'categories',
  'areas',
  'freelancer_profiles',
  'leads',
  'subscriptions',
  'lead_interests',
  'inquiries',
  'reviews',
  'payments',
  'notifications',
  'freelancer_lead_interactions'
];

async function testConnections() {
  console.log('🔄 Testing database connections...');
  
  try {
    // Test local connection
    const localResult = await localPool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Local PostgreSQL connection successful');
    console.log(`   Time: ${localResult.rows[0].current_time}`);
    console.log(`   Version: ${localResult.rows[0].version.split(' ')[0]} ${localResult.rows[0].version.split(' ')[1]}`);
  } catch (error) {
    console.error('❌ Local PostgreSQL connection failed:', error.message);
    throw error;
  }

  try {
    // Test Neon connection
    const neonResult = await neonPool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Neon PostgreSQL connection successful');
    console.log(`   Time: ${neonResult.rows[0].current_time}`);
    console.log(`   Version: ${neonResult.rows[0].version.split(' ')[0]} ${neonResult.rows[0].version.split(' ')[1]}`);
  } catch (error) {
    console.error('❌ Neon PostgreSQL connection failed:', error.message);
    throw error;
  }
}

async function verifyTable(tableName) {
  console.log(`\n🔄 Verifying table: ${tableName}`);
  
  try {
    // Check if table exists in both databases
    const localExists = await localPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    const neonExists = await neonPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    if (!localExists.rows[0].exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist in local database, skipping...`);
      return { table: tableName, status: 'skipped', reason: 'not_in_local' };
    }
    
    if (!neonExists.rows[0].exists) {
      console.log(`   ❌ Table ${tableName} does not exist in Neon database`);
      return { table: tableName, status: 'failed', reason: 'not_in_neon' };
    }
    
    // Get row counts
    const localCount = await localPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const neonCount = await neonPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    
    const localRowCount = parseInt(localCount.rows[0].count);
    const neonRowCount = parseInt(neonCount.rows[0].count);
    
    console.log(`   📊 Local rows: ${localRowCount}`);
    console.log(`   📊 Neon rows: ${neonRowCount}`);
    
    if (localRowCount === neonRowCount) {
      console.log(`   ✅ Row count matches`);
      
      // Sample data comparison (first 5 rows)
      if (localRowCount > 0) {
        const localSample = await localPool.query(`SELECT * FROM ${tableName} LIMIT 5`);
        const neonSample = await neonPool.query(`SELECT * FROM ${tableName} LIMIT 5`);
        
        // Compare sample data
        const localSampleData = localSample.rows.map(row => JSON.stringify(row, Object.keys(row).sort()));
        const neonSampleData = neonSample.rows.map(row => JSON.stringify(row, Object.keys(row).sort()));
        
        const samplesMatch = JSON.stringify(localSampleData) === JSON.stringify(neonSampleData);
        
        if (samplesMatch) {
          console.log(`   ✅ Sample data matches`);
          return { table: tableName, status: 'success', localRows: localRowCount, neonRows: neonRowCount };
        } else {
          console.log(`   ⚠️  Sample data differs (this might be due to ordering)`);
          return { table: tableName, status: 'warning', localRows: localRowCount, neonRows: neonRowCount, reason: 'sample_data_differs' };
        }
      } else {
        return { table: tableName, status: 'success', localRows: localRowCount, neonRows: neonRowCount };
      }
    } else {
      console.log(`   ❌ Row count mismatch`);
      return { table: tableName, status: 'failed', localRows: localRowCount, neonRows: neonRowCount, reason: 'row_count_mismatch' };
    }
    
  } catch (error) {
    console.error(`   ❌ Error verifying ${tableName}:`, error.message);
    return { table: tableName, status: 'error', reason: error.message };
  }
}

async function verifySchema() {
  console.log('\n🔄 Verifying database schema...');
  
  try {
    // Check enums
    const localEnums = await localPool.query(`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      ORDER BY typname, enumlabel
    `);
    
    const neonEnums = await neonPool.query(`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      ORDER BY typname, enumlabel
    `);
    
    console.log(`   📊 Local enums: ${localEnums.rows.length}`);
    console.log(`   📊 Neon enums: ${neonEnums.rows.length}`);
    
    if (localEnums.rows.length === neonEnums.rows.length) {
      console.log(`   ✅ Enum count matches`);
    } else {
      console.log(`   ⚠️  Enum count differs`);
    }
    
    // Check indexes
    const localIndexes = await localPool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    const neonIndexes = await neonPool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`   📊 Local indexes: ${localIndexes.rows.length}`);
    console.log(`   📊 Neon indexes: ${neonIndexes.rows.length}`);
    
    if (localIndexes.rows.length === neonIndexes.rows.length) {
      console.log(`   ✅ Index count matches`);
    } else {
      console.log(`   ⚠️  Index count differs`);
    }
    
  } catch (error) {
    console.error('   ❌ Error verifying schema:', error.message);
  }
}

async function verifyMigration() {
  console.log('🚀 Starting migration verification...');
  
  const results = [];
  
  try {
    // Test connections
    await testConnections();
    
    // Verify schema
    await verifySchema();
    
    // Verify each table
    for (const tableName of TABLES) {
      const result = await verifyTable(tableName);
      results.push(result);
    }
    
    // Summary
    console.log('\n📊 Migration Verification Summary:');
    console.log('=====================================');
    
    const successful = results.filter(r => r.status === 'success').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚫 Errors: ${errors}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n❌ Migration verification failed!');
      console.log('\nFailed tables:');
      results.filter(r => r.status === 'failed' || r.status === 'error').forEach(r => {
        console.log(`   - ${r.table}: ${r.reason}`);
      });
    } else if (warnings > 0) {
      console.log('\n⚠️  Migration completed with warnings');
      console.log('\nWarning tables:');
      results.filter(r => r.status === 'warning').forEach(r => {
        console.log(`   - ${r.table}: ${r.reason}`);
      });
    } else {
      console.log('\n🎉 Migration verification successful!');
    }
    
    // Save verification report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(__dirname, 'backups', `verification-report-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        successful,
        warnings,
        failed,
        errors,
        skipped
      },
      results
    };
    
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Verification report saved to: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMigration().catch(console.error);
}

export { verifyMigration };
