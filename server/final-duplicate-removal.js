import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function removeDuplicateCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting duplicate categories removal...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Create backup
    console.log('\n📦 Creating backup...');
    const { rows: backupData } = await client.query(
      'SELECT * FROM categories ORDER BY name'
    );
    
    const backupFileName = `categories-backup-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${backupFileName}`);
    console.log(`📊 Total categories in backup: ${backupData.length}`);
    
    // Step 2: Find duplicates
    console.log('\n🔍 Finding duplicates...');
    const { rows: duplicates } = await client.query(`
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    console.log(`📊 Found ${duplicates.length} duplicate groups`);
    
    if (duplicates.length > 0) {
      console.log('\n❌ Duplicate groups found:');
      duplicates.slice(0, 10).forEach(dup => {
        console.log(`  • "${dup.normalized_name}": ${dup.count} duplicates`);
      });
      if (duplicates.length > 10) {
        console.log(`  ... and ${duplicates.length - 10} more groups`);
      }
    }
    
    // Step 3: Update foreign key references
    console.log('\n🔄 Updating foreign key references...');
    
    // Update freelancer_profiles
    const { rowCount: freelancerUpdates } = await client.query(`
      UPDATE freelancer_profiles fp
      SET category_id = (
        SELECT MIN(c2.id) 
        FROM categories c2 
        WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM((
          SELECT c1.name FROM categories c1 WHERE c1.id = fp.category_id
        )))
      )
      WHERE category_id IN (
        SELECT c1.id 
        FROM categories c1 
        WHERE c1.id NOT IN (
          SELECT MIN(c2.id) 
          FROM categories c2 
          GROUP BY LOWER(TRIM(c2.name))
        )
      )
    `);
    console.log(`✅ Updated ${freelancerUpdates} freelancer profiles`);
    
    // Update leads
    const { rowCount: leadsUpdates } = await client.query(`
      UPDATE leads l
      SET category_id = (
        SELECT MIN(c2.id) 
        FROM categories c2 
        WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM((
          SELECT c1.name FROM categories c1 WHERE c1.id = l.category_id
        )))
      )
      WHERE category_id IN (
        SELECT c1.id 
        FROM categories c1 
        WHERE c1.id NOT IN (
          SELECT MIN(c2.id) 
          FROM categories c2 
          GROUP BY LOWER(TRIM(c2.name))
        )
      )
    `);
    console.log(`✅ Updated ${leadsUpdates} leads`);
    
    // Update subscriptions
    const { rowCount: subscriptionUpdates } = await client.query(`
      UPDATE subscriptions s
      SET category_id = (
        SELECT MIN(c2.id) 
        FROM categories c2 
        WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM((
          SELECT c1.name FROM categories c1 WHERE c1.id = s.category_id
        )))
      )
      WHERE category_id IN (
        SELECT c1.id 
        FROM categories c1 
        WHERE c1.id NOT IN (
          SELECT MIN(c2.id) 
          FROM categories c2 
          GROUP BY LOWER(TRIM(c2.name))
        )
      )
    `);
    console.log(`✅ Updated ${subscriptionUpdates} subscriptions`);
    
    // Step 4: Remove duplicates
    console.log('\n🗑️  Removing duplicate categories...');
    const { rowCount: deletedRows } = await client.query(`
      DELETE FROM categories 
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM categories
        GROUP BY LOWER(TRIM(name))
      )
    `);
    
    console.log(`✅ Deleted ${deletedRows} duplicate categories`);
    
    // Step 5: Normalize names
    console.log('\n✨ Normalizing category names...');
    const { rowCount: normalizedRows } = await client.query(`
      UPDATE categories 
      SET name = TRIM(name)
      WHERE name != TRIM(name)
    `);
    
    if (normalizedRows > 0) {
      console.log(`✅ Normalized ${normalizedRows} category names`);
    }
    
    // Step 6: Verify results
    console.log('\n🔍 Verifying results...');
    const { rows: finalCount } = await client.query('SELECT COUNT(*) as total FROM categories');
    console.log(`📊 Final categories count: ${finalCount[0].total}`);
    
    // Check for remaining duplicates
    const { rows: remainingDuplicates } = await client.query(`
      SELECT name, COUNT(*) as count
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicates remain!');
    } else {
      console.log('❌ Duplicates still found:', remainingDuplicates.length);
    }
    
    // Step 7: Show final categories
    console.log('\n📋 Final categories list:');
    const { rows: finalCategories } = await client.query(`
      SELECT id, name, icon, color, created_at
      FROM categories 
      ORDER BY LOWER(TRIM(name)), created_at
    `);
    
    finalCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} ${cat.icon} (${cat.id})`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n🎉 Transaction committed successfully!');
    
    // Summary
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`  • Original categories: ${backupData.length}`);
    console.log(`  • Final categories: ${finalCategories.length}`);
    console.log(`  • Duplicates removed: ${backupData.length - finalCategories.length}`);
    console.log(`  • Reduction: ${((backupData.length - finalCategories.length) / backupData.length * 100).toFixed(1)}%`);
    console.log(`  • Backup saved: ${backupFileName}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await client.query('ROLLBACK');
    console.log('🔄 Transaction rolled back');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
removeDuplicateCategories()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
