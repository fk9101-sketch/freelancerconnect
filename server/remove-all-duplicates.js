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

async function removeAllDuplicateCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive duplicate categories removal...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Create comprehensive backup
    console.log('\n📦 Creating backup of current categories...');
    const { rows: backupData } = await client.query(
      'SELECT * FROM categories ORDER BY name'
    );
    
    const backupFileName = `categories-complete-backup-${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${backupFileName}`);
    console.log(`📊 Total categories in backup: ${backupData.length}`);
    
    // Step 2: Analyze current state
    console.log('\n🔍 Analyzing current database state...');
    
    // Get total count
    const { rows: totalCount } = await client.query('SELECT COUNT(*) as total FROM categories');
    console.log(`📊 Total categories: ${totalCount[0].total}`);
    
    // Find exact duplicates
    const { rows: exactDuplicates } = await client.query(`
      SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, name
    `);
    
    // Find case-insensitive duplicates
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
    
    // Step 3: Get all tables that reference categories
    console.log('\n🔗 Identifying tables that reference categories...');
    const { rows: referencingTables } = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        COUNT(*) as reference_count
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.referenced_table_name = 'categories'
      GROUP BY tc.table_name, kcu.column_name
      ORDER BY tc.table_name
    `);
    
    console.log('📋 Tables referencing categories:');
    referencingTables.forEach(table => {
      console.log(`  • ${table.table_name}.${table.column_name} (${table.reference_count} references)`);
    });
    
    // Step 4: Update all foreign key references BEFORE deleting
    console.log('\n🔄 Updating foreign key references...');
    
    // Process each table that references categories
    for (const table of referencingTables) {
      const tableName = table.table_name;
      const columnName = table.column_name;
      
      console.log(`  🔄 Processing ${tableName}.${columnName}...`);
      
      // Get count of records that need updating
      const { rows: updateCount } = await client.query(`
        SELECT COUNT(*) as count
        FROM ${tableName} t
        WHERE t.${columnName} IN (
          SELECT c1.id 
          FROM categories c1 
          WHERE c1.id NOT IN (
            SELECT MIN(c2.id) 
            FROM categories c2 
            GROUP BY LOWER(TRIM(c2.name))
          )
        )
      `);
      
      if (updateCount[0].count > 0) {
        console.log(`    📝 Found ${updateCount[0].count} records to update`);
        
        // Update references to point to the kept categories
        const { rowCount: updatedRows } = await client.query(`
          UPDATE ${tableName} 
          SET ${columnName} = (
            SELECT MIN(c2.id) 
            FROM categories c2 
            WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(categories.name))
          )
          WHERE ${columnName} IN (
            SELECT c1.id 
            FROM categories c1 
            WHERE c1.id NOT IN (
              SELECT MIN(c2.id) 
              FROM categories c2 
              GROUP BY LOWER(TRIM(c2.name))
            )
          )
        `);
        
        console.log(`    ✅ Updated ${updatedRows} records`);
      } else {
        console.log(`    ✅ No records need updating`);
      }
    }
    
    // Step 5: Remove duplicate categories
    console.log('\n🗑️  Removing duplicate categories...');
    
    // Get count of categories to be deleted
    const { rows: deleteCount } = await client.query(`
      SELECT COUNT(*) as count
      FROM categories 
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM categories
        GROUP BY LOWER(TRIM(name))
      )
    `);
    
    console.log(`📊 Categories to be deleted: ${deleteCount[0].count}`);
    
    // Delete duplicates
    const { rowCount: deletedRows } = await client.query(`
      DELETE FROM categories 
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM categories
        GROUP BY LOWER(TRIM(name))
      )
    `);
    
    console.log(`✅ Deleted ${deletedRows} duplicate categories`);
    
    // Step 6: Normalize remaining category names
    console.log('\n✨ Normalizing remaining category names...');
    
    const { rowCount: normalizedRows } = await client.query(`
      UPDATE categories 
      SET name = TRIM(name)
      WHERE name != TRIM(name)
    `);
    
    if (normalizedRows > 0) {
      console.log(`✅ Normalized ${normalizedRows} category names`);
    } else {
      console.log(`✅ No category names needed normalization`);
    }
    
    // Step 7: Verify results
    console.log('\n🔍 Verifying results...');
    
    // Get final count
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
      console.log('✅ No duplicates remain - cleanup successful!');
    } else {
      console.log('❌ Duplicates still found:');
      remainingDuplicates.forEach(dup => {
        console.log(`  • "${dup.name}": ${dup.count} instances`);
      });
    }
    
    // Step 8: Verify referential integrity
    console.log('\n🔗 Verifying referential integrity...');
    
    let integrityIssues = 0;
    for (const table of referencingTables) {
      const tableName = table.table_name;
      const columnName = table.column_name;
      
      const { rows: orphanedCount } = await client.query(`
        SELECT COUNT(*) as count
        FROM ${tableName} t
        LEFT JOIN categories c ON t.${columnName} = c.id
        WHERE c.id IS NULL
      `);
      
      if (orphanedCount[0].count > 0) {
        console.log(`  ❌ ${tableName}.${columnName}: ${orphanedCount[0].count} orphaned references`);
        integrityIssues++;
      } else {
        console.log(`  ✅ ${tableName}.${columnName}: No orphaned references`);
      }
    }
    
    if (integrityIssues === 0) {
      console.log('✅ All referential integrity checks passed!');
    } else {
      console.log(`❌ Found ${integrityIssues} referential integrity issues`);
    }
    
    // Step 9: Show final categories
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
removeAllDuplicateCategories()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
