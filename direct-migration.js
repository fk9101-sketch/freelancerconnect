#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

// Direct Neon configuration
const NEON_DB_CONFIG = {
  host: 'ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_1U4pOodrCNbP',
  ssl: { rejectUnauthorized: false }
};

// Local database configuration
const LOCAL_DB_CONFIG = {
  host: 'localhost',
  port: 5000,
  database: 'hirelocal',
  user: 'postgres',
  password: 'Jhotwara#321'
};

const localPool = new Pool(LOCAL_DB_CONFIG);
const neonPool = new Pool(NEON_DB_CONFIG);

async function testConnections() {
  console.log('🔄 Testing database connections...');
  
  try {
    // Test local connection
    const localResult = await localPool.query('SELECT NOW() as current_time');
    console.log('✅ Local PostgreSQL connection successful');
    console.log(`   Time: ${localResult.rows[0].current_time}`);
  } catch (error) {
    console.error('❌ Local PostgreSQL connection failed:', error.message);
    throw error;
  }

  try {
    // Test Neon connection
    const neonResult = await neonPool.query('SELECT NOW() as current_time');
    console.log('✅ Neon PostgreSQL connection successful');
    console.log(`   Time: ${neonResult.rows[0].current_time}`);
  } catch (error) {
    console.error('❌ Neon PostgreSQL connection failed:', error.message);
    throw error;
  }
}

async function getLocalTables() {
  console.log('\n🔄 Getting local database tables...');
  
  const result = await localPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('Local tables:');
  result.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  
  return result.rows.map(row => row.table_name);
}

async function getNeonTables() {
  console.log('\n🔄 Getting Neon database tables...');
  
  const result = await neonPool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('Neon tables:');
  result.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  
  return result.rows.map(row => row.table_name);
}

async function migrateTable(tableName) {
  console.log(`\n🔄 Migrating table: ${tableName}`);
  
  try {
    // Check if table exists in local database
    const localExists = await localPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    if (!localExists.rows[0].exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist in local database, skipping...`);
      return;
    }
    
    // Get row count from local
    const localCount = await localPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const localRowCount = parseInt(localCount.rows[0].count);
    
    console.log(`   📊 Local rows: ${localRowCount}`);
    
    if (localRowCount === 0) {
      console.log(`   ⚠️  No data to migrate for ${tableName}`);
      return;
    }
    
    // Get data from local
    const localData = await localPool.query(`SELECT * FROM ${tableName}`);
    console.log(`   📥 Exported ${localData.rows.length} rows from local`);
    
    // Check if table exists in Neon
    const neonExists = await neonPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    if (!neonExists.rows[0].exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist in Neon, skipping data migration...`);
      return;
    }
    
    // Clear existing data in Neon (optional)
    await neonPool.query(`DELETE FROM ${tableName}`);
    console.log(`   🗑️  Cleared existing data in Neon`);
    
    // Insert data into Neon
    if (localData.rows.length > 0) {
      const columns = Object.keys(localData.rows[0]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      for (const row of localData.rows) {
        const values = columns.map(col => row[col]);
        await neonPool.query(insertSQL, values);
      }
      
      console.log(`   📤 Imported ${localData.rows.length} rows to Neon`);
    }
    
    // Verify migration
    const neonCount = await neonPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const neonRowCount = parseInt(neonCount.rows[0].count);
    
    console.log(`   📊 Neon rows: ${neonRowCount}`);
    
    if (localRowCount === neonRowCount) {
      console.log(`   ✅ Migration successful for ${tableName}`);
    } else {
      console.log(`   ⚠️  Row count mismatch for ${tableName}`);
    }
    
  } catch (error) {
    console.error(`   ❌ Failed to migrate ${tableName}:`, error.message);
  }
}

async function runMigration() {
  console.log('🚀 Starting database migration from local PostgreSQL to Neon...');
  
  try {
    // Test connections
    await testConnections();
    
    // Get table lists
    const localTables = await getLocalTables();
    const neonTables = await getNeonTables();
    
    console.log('\n🔄 Starting data migration...');
    
    // Migrate each table
    for (const tableName of localTables) {
      await migrateTable(tableName);
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

// Run migration
runMigration().catch(console.error);
