import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
});

const db = drizzle(pool, { schema });

async function initializeAreas() {
  try {
    console.log('🔄 Initializing areas...');
    console.log('📁 Current directory:', __dirname);
    
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Read areas from JSON file
    const areasPath = path.join(__dirname, 'data', 'jaipur_areas_50km.json');
    console.log('📖 Reading areas from:', areasPath);
    
    if (!fs.existsSync(areasPath)) {
      throw new Error(`Areas file not found at: ${areasPath}`);
    }
    
    const areasData = fs.readFileSync(areasPath, 'utf8');
    const areas: string[] = JSON.parse(areasData);
    
    console.log(`📖 Loaded ${areas.length} areas from JSON file`);
    console.log('📋 First 5 areas:', areas.slice(0, 5));
    
    // Insert areas into database
    let insertedCount = 0;
    let skippedCount = 0;
    
    console.log('💾 Inserting areas into database...');
    
    for (const areaName of areas) {
      try {
        await db.insert(schema.areas).values({
          name: areaName,
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          isActive: true
        }).onConflictDoNothing();
        
        insertedCount++;
        if (insertedCount % 10 === 0) {
          console.log(`   Processed ${insertedCount} areas...`);
        }
      } catch (error) {
        console.log(`⚠️ Skipped area "${areaName}" (likely already exists)`);
        skippedCount++;
      }
    }
    
    console.log(`✅ Areas initialization completed:`);
    console.log(`   - Inserted: ${insertedCount} areas`);
    console.log(`   - Skipped: ${skippedCount} areas (already existed)`);
    console.log(`   - Total processed: ${areas.length} areas`);
    
  } catch (error) {
    console.error('❌ Areas initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if this file is executed directly
console.log('🚀 Starting areas initialization...');
initializeAreas().catch(console.error);
