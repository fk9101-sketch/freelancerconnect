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
    
    // Step 1: Create comprehensive backup
    console.log('\n📦 Creating backup of current categories...');
    const { rows: backupData } = await client.query(
      'SELECT * FROM categories ORDER BY name'
    );
    
    const backupFileName = `categories-backup-before-cleanup-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${backupFileName}`);
    console.log(`📊 Total categories in backup: ${backupData.length}`);
    
    // Step 2: Find and display duplicates before cleanup
    console.log('\n🔍 Analyzing duplicates before cleanup...');
    
    // Exact duplicates
    const { rows: exactDuplicates } = await client.query(`
      SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, name
    `);
    
    // Case-insensitive duplicates
    const { rows: caseInsensitiveDuplicates } = await client.query(`
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as count,
        ARRAY_AGG(DISTINCT name) as original_names,
        ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY count DESC, normalized_name
    `);
    
    console.log(`📊 Found ${exactDuplicates.length} exact duplicates and ${caseInsensitiveDuplicates.length} case-insensitive duplicates`);
    
    if (exactDuplicates.length > 0) {
      console.log('\n❌ Exact duplicates found:');
      exactDuplicates.forEach(dup => {
        console.log(`  • "${dup.name}": ${dup.count} duplicates (IDs: ${dup.ids.join(', ')})`);
      });
    }
    
    if (caseInsensitiveDuplicates.length > 0) {
      console.log('\n❌ Case-insensitive duplicates found:');
      caseInsensitiveDuplicates.forEach(dup => {
        console.log(`  • "${dup.normalized_name}": ${dup.count} variants (${dup.original_names.join(', ')})`);
        console.log(`    IDs: ${dup.ids.join(', ')}`);
      });
    }
    
    // Step 3: Handle case-insensitive duplicates first
    if (caseInsensitiveDuplicates.length > 0) {
      console.log('\n🔄 Fixing case-insensitive duplicates...');
      
      for (const dup of caseInsensitiveDuplicates) {
        const ids = dup.ids;
        const keepId = ids[0]; // Keep the first (lowest) ID
        const deleteIds = ids.slice(1); // Delete the rest
        
        console.log(`  🔄 Processing "${dup.normalized_name}":`);
        console.log(`    ✅ Keeping ID: ${keepId}`);
        console.log(`    🗑️  Deleting IDs: ${deleteIds.join(', ')}`);
        
        // Update any references to the deleted categories
        // Update freelancer profiles
        for (const deleteId of deleteIds) {
          const { rowCount: freelancerUpdates } = await client.query(
            'UPDATE freelancer_profiles SET category_id = $1 WHERE category_id = $2',
            [keepId, deleteId]
          );
          
          if (freelancerUpdates > 0) {
            console.log(`      📝 Updated ${freelancerUpdates} freelancer profiles`);
          }
        }
        
        // Update leads (if table exists)
        try {
          for (const deleteId of deleteIds) {
            const { rowCount: leadUpdates } = await client.query(
              'UPDATE leads SET category_id = $1 WHERE category_id = $2',
              [keepId, deleteId]
            );
            
            if (leadUpdates > 0) {
              console.log(`      📝 Updated ${leadUpdates} leads`);
            }
          }
        } catch (error) {
          console.log('      ℹ️  Leads table not found or no updates needed');
        }
        
        // Update subscriptions (if table exists)
        try {
          for (const deleteId of deleteIds) {
            const { rowCount: subscriptionUpdates } = await client.query(
              'UPDATE subscriptions SET category_id = $1 WHERE category_id = $2',
              [keepId, deleteId]
            );
            
            if (subscriptionUpdates > 0) {
              console.log(`      📝 Updated ${subscriptionUpdates} subscriptions`);
            }
          }
        } catch (error) {
          console.log('      ℹ️  Subscriptions table not found or no updates needed');
        }
        
        // Delete the duplicate categories
        for (const deleteId of deleteIds) {
          await client.query('DELETE FROM categories WHERE id = $1', [deleteId]);
        }
        
        console.log(`      ✅ Deleted ${deleteIds.length} duplicate categories`);
      }
    }
    
    // Step 4: Handle exact duplicates (should be none after case-insensitive cleanup)
    const { rows: remainingExactDuplicates } = await client.query(`
      SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, name
    `);
    
    if (remainingExactDuplicates.length > 0) {
      console.log('\n🔄 Fixing remaining exact duplicates...');
      
      for (const dup of remainingExactDuplicates) {
        const ids = dup.ids;
        const keepId = ids[0]; // Keep the first (lowest) ID
        const deleteIds = ids.slice(1); // Delete the rest
        
        console.log(`  🔄 Processing "${dup.name}":`);
        console.log(`    ✅ Keeping ID: ${keepId}`);
        console.log(`    🗑️  Deleting IDs: ${deleteIds.join(', ')}`);
        
        // Update references and delete duplicates
        for (const deleteId of deleteIds) {
          // Update freelancer profiles
          const { rowCount: freelancerUpdates } = await client.query(
            'UPDATE freelancer_profiles SET category_id = $1 WHERE category_id = $2',
            [keepId, deleteId]
          );
          
          if (freelancerUpdates > 0) {
            console.log(`      📝 Updated ${freelancerUpdates} freelancer profiles`);
          }
          
          // Delete the duplicate category
          await client.query('DELETE FROM categories WHERE id = $1', [deleteId]);
        }
        
        console.log(`      ✅ Deleted ${deleteIds.length} duplicate categories`);
      }
    }
    
    // Step 5: Normalize remaining category names
    console.log('\n🔄 Normalizing category names...');
    const { rows: categoriesToNormalize } = await client.query(`
      SELECT id, name FROM categories 
      WHERE name != LOWER(TRIM(name))
      ORDER BY name
    `);
    
    let normalizedCount = 0;
    for (const category of categoriesToNormalize) {
      const normalizedName = category.name.toLowerCase().trim();
      await client.query(
        'UPDATE categories SET name = $1 WHERE id = $2',
        [normalizedName, category.id]
      );
      console.log(`  ✅ Normalized: "${category.name}" → "${normalizedName}"`);
      normalizedCount++;
    }
    
    if (normalizedCount === 0) {
      console.log('  ℹ️  No categories needed normalization');
    }
    
    // Step 6: Final verification
    console.log('\n📊 Final verification...');
    const { rows: finalCategories } = await client.query(`
      SELECT id, name, icon, color, created_at
      FROM categories 
      ORDER BY LOWER(TRIM(name)), created_at
    `);
    
    console.log(`\n📊 Final Results:`);
    console.log(`  • Total categories: ${finalCategories.length}`);
    console.log(`  • Categories removed: ${backupData.length - finalCategories.length}`);
    console.log(`  • Categories normalized: ${normalizedCount}`);
    
    // Check for any remaining duplicates
    const { rows: finalDuplicateCheck } = await client.query(`
      SELECT name, COUNT(*) as count
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `);
    
    if (finalDuplicateCheck.length === 0) {
      console.log('  ✅ No duplicates remaining - cleanup successful!');
    } else {
      console.log(`  ❌ Still found ${finalDuplicateCheck.length} duplicates - cleanup incomplete`);
      finalDuplicateCheck.forEach(dup => {
        console.log(`    • "${dup.name}": ${dup.count} instances`);
      });
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Duplicate categories cleanup completed successfully!');
    
    // Show final categories list
    console.log('\n📋 Final Categories List:');
    finalCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} ${cat.icon} (ID: ${cat.id})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
removeDuplicateCategories()
  .then(() => {
    console.log('\n🎉 Database cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
