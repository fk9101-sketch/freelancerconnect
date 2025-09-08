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

// Tables to migrate (in dependency order)
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

// Enums to create
const ENUMS = [
  {
    name: 'user_role',
    values: ['customer', 'freelancer', 'admin']
  },
  {
    name: 'lead_status',
    values: ['pending', 'accepted', 'completed', 'cancelled', 'missed', 'ignored']
  },
  {
    name: 'subscription_status',
    values: ['active', 'expired', 'cancelled']
  },
  {
    name: 'subscription_type',
    values: ['lead', 'position', 'badge']
  },
  {
    name: 'badge_type',
    values: ['verified', 'trusted']
  },
  {
    name: 'verification_status',
    values: ['pending', 'approved', 'rejected']
  },
  {
    name: 'payment_status',
    values: ['pending', 'success', 'failed', 'cancelled']
  },
  {
    name: 'payment_method',
    values: ['razorpay', 'other']
  }
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

async function createEnums() {
  console.log('🔄 Creating enums in Neon database...');
  
  for (const enumDef of ENUMS) {
    try {
      const values = enumDef.values.map(v => `'${v}'`).join(', ');
      await neonPool.query(`CREATE TYPE ${enumDef.name} AS ENUM (${values})`);
      console.log(`   ✅ Created enum: ${enumDef.name}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  Enum ${enumDef.name} already exists, skipping...`);
      } else {
        console.error(`   ❌ Failed to create enum ${enumDef.name}:`, error.message);
        throw error;
      }
    }
  }
}

async function getTableSchema(tableName) {
  const query = `
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
  
  const result = await localPool.query(query, [tableName]);
  return result.rows;
}

async function createTableInNeon(tableName, columns) {
  console.log(`   🔄 Creating table: ${tableName}`);
  
  let createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  const columnDefs = columns.map(col => {
    let def = `  ${col.column_name} `;
    
    // Handle data types
    if (col.udt_name && col.udt_name.startsWith('_')) {
      // Array type
      const baseType = col.udt_name.substring(1);
      def += `${baseType}[]`;
    } else if (col.udt_name) {
      def += col.udt_name;
    } else if (col.data_type === 'character varying') {
      def += `VARCHAR${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`;
    } else if (col.data_type === 'numeric') {
      def += `NUMERIC(${col.numeric_precision}, ${col.numeric_scale})`;
    } else if (col.data_type === 'timestamp without time zone') {
      def += 'TIMESTAMP';
    } else if (col.data_type === 'timestamp with time zone') {
      def += 'TIMESTAMPTZ';
    } else {
      def += col.data_type.toUpperCase();
    }
    
    // Handle constraints
    if (col.column_name === 'id' && col.column_default?.includes('gen_random_uuid')) {
      def += ' PRIMARY KEY DEFAULT gen_random_uuid()';
    } else if (col.column_name === 'id' && col.column_default?.includes('nextval')) {
      def += ' PRIMARY KEY';
    } else if (col.is_nullable === 'NO' && !col.column_default) {
      def += ' NOT NULL';
    } else if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  });
  
  createSQL += columnDefs.join(',\n');
  createSQL += '\n)';
  
  try {
    await neonPool.query(createSQL);
    console.log(`   ✅ Created table: ${tableName}`);
  } catch (error) {
    console.error(`   ❌ Failed to create table ${tableName}:`, error.message);
    throw error;
  }
}

async function exportTableData(tableName) {
  console.log(`   🔄 Exporting data from: ${tableName}`);
  
  try {
    const result = await localPool.query(`SELECT * FROM ${tableName}`);
    console.log(`   ✅ Exported ${result.rows.length} rows from ${tableName}`);
    return result.rows;
  } catch (error) {
    console.error(`   ❌ Failed to export data from ${tableName}:`, error.message);
    throw error;
  }
}

async function importTableData(tableName, data) {
  if (data.length === 0) {
    console.log(`   ⚠️  No data to import for ${tableName}`);
    return;
  }
  
  console.log(`   🔄 Importing ${data.length} rows to: ${tableName}`);
  
  try {
    // Get column names
    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        await neonPool.query(insertSQL, values);
      }
    }
    
    console.log(`   ✅ Imported ${data.length} rows to ${tableName}`);
  } catch (error) {
    console.error(`   ❌ Failed to import data to ${tableName}:`, error.message);
    throw error;
  }
}

async function createIndexes() {
  console.log('🔄 Creating indexes in Neon database...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_leads_category_id ON leads(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_category_id ON freelancer_profiles(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_subscriptions_freelancer_id ON subscriptions(freelancer_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_freelancer_id ON freelancer_lead_interactions(freelancer_id)',
    'CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_lead_id ON freelancer_lead_interactions(lead_id)'
  ];
  
  for (const indexSQL of indexes) {
    try {
      await neonPool.query(indexSQL);
      console.log(`   ✅ Created index: ${indexSQL.split(' ')[5]}`);
    } catch (error) {
      console.error(`   ❌ Failed to create index:`, error.message);
    }
  }
}

async function migrateDatabase() {
  console.log('🚀 Starting database migration from local PostgreSQL to Neon...');
  
  try {
    // Test connections
    await testConnections();
    
    // Create enums
    await createEnums();
    
    // Migrate each table
    for (const tableName of TABLES) {
      console.log(`\n🔄 Migrating table: ${tableName}`);
      
      try {
        // Check if table exists in local database
        const tableExists = await localPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`   ⚠️  Table ${tableName} does not exist in local database, skipping...`);
          continue;
        }
        
        // Get table schema
        const columns = await getTableSchema(tableName);
        
        // Create table in Neon
        await createTableInNeon(tableName, columns);
        
        // Export data from local
        const data = await exportTableData(tableName);
        
        // Import data to Neon
        await importTableData(tableName, data);
        
        console.log(`   ✅ Successfully migrated table: ${tableName}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate table ${tableName}:`, error.message);
        // Continue with other tables
      }
    }
    
    // Create indexes
    await createIndexes();
    
    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase().catch(console.error);
}

export { migrateDatabase };
