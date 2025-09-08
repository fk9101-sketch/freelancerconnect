#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local database configuration
const LOCAL_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
};

const localPool = new Pool(LOCAL_DB_CONFIG);

// Tables to export (in dependency order)
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

async function exportTableData(tableName) {
  console.log(`🔄 Exporting ${tableName}...`);
  
  try {
    // Check if table exists
    const tableExists = await localPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist, skipping...`);
      return { table: tableName, data: [], count: 0 };
    }
    
    // Get table schema
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await localPool.query(schemaQuery, [tableName]);
    const schema = schemaResult.rows;
    
    // Get table data
    const dataResult = await localPool.query(`SELECT * FROM ${tableName}`);
    const data = dataResult.rows;
    
    console.log(`   ✅ Exported ${data.length} rows from ${tableName}`);
    
    return {
      table: tableName,
      schema: schema,
      data: data,
      count: data.length
    };
    
  } catch (error) {
    console.error(`   ❌ Failed to export ${tableName}:`, error.message);
    return { table: tableName, data: [], count: 0, error: error.message };
  }
}

async function exportDatabase() {
  console.log('🚀 Starting database export...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups', `export-${timestamp}`);
  
  // Create backup directory
  if (!fs.existsSync(path.join(__dirname, 'backups'))) {
    fs.mkdirSync(path.join(__dirname, 'backups'));
  }
  fs.mkdirSync(backupDir, { recursive: true });
  
  const exportData = {
    timestamp: new Date().toISOString(),
    source: 'local_postgresql',
    tables: []
  };
  
  try {
    // Test connection
    const result = await localPool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Connected to local PostgreSQL database');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Export each table
    for (const tableName of TABLES) {
      const tableData = await exportTableData(tableName);
      exportData.tables.push(tableData);
    }
    
    // Save complete export
    const exportFile = path.join(backupDir, 'complete-export.json');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Complete export saved to: ${exportFile}`);
    
    // Save individual table files
    for (const tableData of exportData.tables) {
      if (tableData.data && tableData.data.length > 0) {
        const tableFile = path.join(backupDir, `${tableData.table}.json`);
        fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));
        console.log(`   📄 ${tableData.table}.json (${tableData.count} rows)`);
      }
    }
    
    // Create SQL dump
    const sqlDumpFile = path.join(backupDir, 'database-dump.sql');
    let sqlDump = `-- Database dump from local PostgreSQL
-- Generated: ${new Date().toISOString()}
-- Source: ${LOCAL_DB_CONFIG.host}:${LOCAL_DB_CONFIG.port}/${LOCAL_DB_CONFIG.database}

`;
    
    for (const tableData of exportData.tables) {
      if (tableData.data && tableData.data.length > 0) {
        sqlDump += `\n-- Table: ${tableData.table}\n`;
        sqlDump += `-- Rows: ${tableData.count}\n\n`;
        
        // Add INSERT statements
        for (const row of tableData.data) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          });
          
          sqlDump += `INSERT INTO ${tableData.table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlDump += '\n';
      }
    }
    
    fs.writeFileSync(sqlDumpFile, sqlDump);
    console.log(`   📄 database-dump.sql created`);
    
    // Summary
    const totalRows = exportData.tables.reduce((sum, table) => sum + table.count, 0);
    console.log(`\n📊 Export Summary:`);
    console.log(`   Tables exported: ${exportData.tables.filter(t => t.count > 0).length}`);
    console.log(`   Total rows: ${totalRows}`);
    console.log(`   Backup directory: ${backupDir}`);
    
    console.log('\n🎉 Database export completed successfully!');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await localPool.end();
  }
}

// Run export if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDatabase().catch(console.error);
}

export { exportDatabase };
