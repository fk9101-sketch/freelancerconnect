import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_1U4pOodrCNbP@ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testCategories() {
  try {
    console.log('🔍 Testing categories in Neon database...');
    
    const sql = neon(DATABASE_URL);
    
    // Check all categories
    console.log('\n📋 All categories in database:');
    const allCategories = await sql`SELECT * FROM categories ORDER BY name`;
    console.log(`Found ${allCategories.length} categories:`);
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, Active: ${cat.is_active})`);
    });
    
    // Check active categories only
    console.log('\n✅ Active categories only:');
    const activeCategories = await sql`SELECT * FROM categories WHERE is_active = true ORDER BY name`;
    console.log(`Found ${activeCategories.length} active categories:`);
    activeCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    
    // Test the exact query used in the API
    console.log('\n🔍 Testing API query (categories for customer panel):');
    const apiQuery = await sql`SELECT * FROM categories WHERE is_active = true ORDER BY name`;
    console.log(`API query returns ${apiQuery.length} categories:`);
    apiQuery.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testCategories();
