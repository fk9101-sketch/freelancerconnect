import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixDuplicateCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting duplicate categories investigation...');
    
    // Step 1: Check current state
    console.log('\n📊 Current Categories Count:');
    const { rows: totalCount } = await client.query(
      'SELECT COUNT(*) as total FROM categories'
    );
    console.log(`Total categories: ${totalCount[0].total}`);
    
    // Step 2: Find exact duplicates (case-sensitive)
    console.log('\n🔍 Finding exact duplicates (case-sensitive):');
    const { rows: exactDuplicates } = await client.query(`
      SELECT name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, name
    `);
    
    if (exactDuplicates.length === 0) {
      console.log('✅ No exact duplicates found');
    } else {
      console.log(`❌ Found ${exactDuplicates.length} categories with exact duplicates:`);
      exactDuplicates.forEach(dup => {
        console.log(`  • "${dup.name}": ${dup.count} duplicates (IDs: ${dup.ids.join(', ')})`);
      });
    }
    
    // Step 3: Find case-insensitive duplicates
    console.log('\n🔍 Finding case-insensitive duplicates:');
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
    
    if (caseInsensitiveDuplicates.length === 0) {
      console.log('✅ No case-insensitive duplicates found');
    } else {
      console.log(`❌ Found ${caseInsensitiveDuplicates.length} categories with case-insensitive duplicates:`);
      caseInsensitiveDuplicates.forEach(dup => {
        console.log(`  • "${dup.normalized_name}": ${dup.count} variants (${dup.original_names.join(', ')})`);
        console.log(`    IDs: ${dup.ids.join(', ')}`);
      });
    }
    
    // Step 4: Check for similar names (fuzzy duplicates)
    console.log('\n🔍 Finding similar names (potential fuzzy duplicates):');
    const { rows: similarNames } = await client.query(`
      SELECT 
        c1.name as name1,
        c2.name as name2,
        c1.id as id1,
        c2.id as id2
      FROM categories c1
      JOIN categories c2 ON c1.id < c2.id
      WHERE (
        c1.name ILIKE '%' || c2.name || '%' 
        OR c2.name ILIKE '%' || c1.name || '%'
        OR LOWER(TRIM(c1.name)) = LOWER(TRIM(c2.name))
      )
      AND c1.id != c2.id
      ORDER BY c1.name, c2.name
    `);
    
    if (similarNames.length === 0) {
      console.log('✅ No similar names found');
    } else {
      console.log(`⚠️  Found ${similarNames.length} pairs of similar names:`);
      similarNames.forEach(pair => {
        console.log(`  • "${pair.name1}" (ID: ${pair.id1}) vs "${pair.name2}" (ID: ${pair.id2})`);
      });
    }
    
    // Step 5: Show current categories list
    console.log('\n📋 Current Categories List:');
    const { rows: allCategories } = await client.query(`
      SELECT id, name, icon, color, created_at
      FROM categories 
      ORDER BY LOWER(TRIM(name)), created_at
    `);
    
    console.log(`Total: ${allCategories.length} categories`);
    allCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} ${cat.icon} (ID: ${cat.id})`);
    });
    
    // Step 6: Provide cleanup recommendations
    console.log('\n💡 Cleanup Recommendations:');
    
    if (exactDuplicates.length > 0 || caseInsensitiveDuplicates.length > 0) {
      console.log('❌ Duplicates detected! Run cleanup script to fix.');
      
      // Create backup before cleanup
      console.log('\n📦 Creating backup of current categories...');
      const { rows: backupData } = await client.query(
        'SELECT * FROM categories ORDER BY name'
      );
      
      const backupFileName = `categories-backup-${Date.now()}.json`;
      const fs = await import('fs');
      fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
      console.log(`✅ Backup created: ${backupFileName}`);
      
      // Show cleanup SQL
      console.log('\n🔧 SQL to fix exact duplicates:');
      console.log(`
-- Fix exact duplicates (keep lowest ID)
DELETE FROM categories 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM categories
    GROUP BY name
);
      `);
      
      console.log('\n🔧 SQL to fix case-insensitive duplicates:');
      console.log(`
-- Fix case-insensitive duplicates (keep lowest ID)
DELETE FROM categories 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM categories
    GROUP BY LOWER(TRIM(name))
);
      `);
      
    } else {
      console.log('✅ No duplicates detected. Database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the investigation
fixDuplicateCategories()
  .then(() => {
    console.log('\n🎉 Investigation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Investigation failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
