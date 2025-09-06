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

// Common freelance categories to ensure exist
const commonCategories = [
  { name: 'web developer', icon: '💻', color: '#3B82F6' },
  { name: 'mobile developer', icon: '📱', color: '#10B981' },
  { name: 'graphic designer', icon: '🎨', color: '#F59E0B' },
  { name: 'content writer', icon: '✍️', color: '#8B5CF6' },
  { name: 'digital marketer', icon: '📈', color: '#EF4444' },
  { name: 'social media manager', icon: '📱', color: '#06B6D4' },
  { name: 'seo specialist', icon: '🔍', color: '#84CC16' },
  { name: 'video editor', icon: '🎬', color: '#EC4899' },
  { name: 'photographer', icon: '📸', color: '#6366F1' },
  { name: 'ui/ux designer', icon: '🎯', color: '#F97316' },
  { name: 'data analyst', icon: '📊', color: '#14B8A6' },
  { name: 'virtual assistant', icon: '👩‍💼', color: '#A855F7' },
  { name: 'translator', icon: '🌐', color: '#22C55E' },
  { name: 'voice over artist', icon: '🎤', color: '#F43F5E' },
  { name: 'illustrator', icon: '✏️', color: '#EAB308' },
  { name: '3d artist', icon: '🎭', color: '#06B6D4' },
  { name: 'game developer', icon: '🎮', color: '#8B5CF6' },
  { name: 'cybersecurity expert', icon: '🔒', color: '#DC2626' },
  { name: 'blockchain developer', icon: '⛓️', color: '#059669' },
  { name: 'machine learning engineer', icon: '🤖', color: '#7C3AED' },
  { name: 'devops engineer', icon: '⚙️', color: '#1F2937' },
  { name: 'qa tester', icon: '🧪', color: '#F59E0B' },
  { name: 'project manager', icon: '📋', color: '#3B82F6' },
  { name: 'business analyst', icon: '📊', color: '#10B981' },
  { name: 'legal consultant', icon: '⚖️', color: '#6366F1' },
  { name: 'accountant', icon: '💰', color: '#059669' },
  { name: 'interior designer', icon: '🏠', color: '#F97316' },
  { name: 'architect', icon: '🏗️', color: '#8B5CF6' },
  { name: 'event planner', icon: '🎉', color: '#EC4899' },
  { name: 'personal trainer', icon: '💪', color: '#DC2626' },
  { name: 'nutritionist', icon: '🥗', color: '#22C55E' },
  { name: 'life coach', icon: '🎯', color: '#F59E0B' },
  { name: 'language tutor', icon: '📚', color: '#3B82F6' },
  { name: 'music teacher', icon: '🎵', color: '#8B5CF6' },
  { name: 'dance instructor', icon: '💃', color: '#EC4899' },
  { name: 'yoga instructor', icon: '🧘', color: '#10B981' },
  { name: 'massage therapist', icon: '💆', color: '#F97316' },
  { name: 'beauty consultant', icon: '💄', color: '#F43F5E' },
  { name: 'fashion designer', icon: '👗', color: '#8B5CF6' },
  { name: 'jewelry designer', icon: '💎', color: '#F59E0B' },
  { name: 'carpenter', icon: '🔨', color: '#A855F7' },
  { name: 'electrician', icon: '⚡', color: '#F59E0B' },
  { name: 'plumber', icon: '🔧', color: '#3B82F6' },
  { name: 'painter', icon: '🎨', color: '#F97316' },
  { name: 'gardener', icon: '🌱', color: '#22C55E' },
  { name: 'cleaner', icon: '🧹', color: '#6B7280' },
  { name: 'cook', icon: '👨‍🍳', color: '#F59E0B' },
  { name: 'driver', icon: '🚗', color: '#3B82F6' },
  { name: 'delivery person', icon: '📦', color: '#10B981' },
  { name: 'security guard', icon: '🛡️', color: '#1F2937' },
  { name: 'receptionist', icon: '👩‍💼', color: '#8B5CF6' },
  { name: 'sales representative', icon: '💼', color: '#F59E0B' },
  { name: 'customer service', icon: '🎧', color: '#3B82F6' },
  { name: 'translator', icon: '🌐', color: '#22C55E' },
  { name: 'interpreter', icon: '🗣️', color: '#8B5CF6' },
  { name: 'tour guide', icon: '🗺️', color: '#10B981' },
  { name: 'travel agent', icon: '✈️', color: '#3B82F6' },
  { name: 'real estate agent', icon: '🏘️', color: '#F59E0B' },
  { name: 'insurance agent', icon: '🛡️', color: '#6366F1' },
  { name: 'loan officer', icon: '💰', color: '#059669' },
  { name: 'tax consultant', icon: '📋', color: '#DC2626' },
  { name: 'hr consultant', icon: '👥', color: '#8B5CF6' },
  { name: 'recruiter', icon: '🔍', color: '#3B82F6' },
  { name: 'trainer', icon: '📚', color: '#F59E0B' },
  { name: 'consultant', icon: '💼', color: '#6366F1' },
  { name: 'freelancer', icon: '💻', color: '#3B82F6' },
  { name: 'other', icon: '🔧', color: '#6B7280' }
];

async function cleanCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting categories cleanup...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Get all current categories
    const { rows: currentCategories } = await client.query(
      'SELECT id, name, icon, color FROM categories ORDER BY name'
    );
    
    console.log(`📊 Found ${currentCategories.length} current categories`);
    
    // Step 2: Normalize category names and find duplicates
    const normalizedCategories = new Map();
    const duplicates = [];
    
    currentCategories.forEach(category => {
      const normalizedName = category.name.toLowerCase().trim();
      
      if (normalizedCategories.has(normalizedName)) {
        duplicates.push({
          original: category,
          duplicate: normalizedCategories.get(normalizedName)
        });
      } else {
        normalizedCategories.set(normalizedName, category);
      }
    });
    
    console.log(`🔍 Found ${duplicates.length} duplicate categories`);
    
    // Step 3: Update category names to normalized versions
    console.log('🔄 Normalizing category names...');
    for (const [normalizedName, category] of normalizedCategories) {
      if (category.name.toLowerCase().trim() !== normalizedName) {
        await client.query(
          'UPDATE categories SET name = $1 WHERE id = $2',
          [normalizedName, category.id]
        );
        console.log(`  ✅ Normalized: "${category.name}" → "${normalizedName}"`);
      }
    }
    
    // Step 4: Handle duplicates by updating references and removing duplicates
    console.log('🔄 Handling duplicates...');
    for (const { original, duplicate } of duplicates) {
      console.log(`  🔄 Processing duplicate: "${original.name}" → keeping "${duplicate.name}"`);
      
      // Update freelancer profiles
      const { rowCount: freelancerUpdates } = await client.query(
        'UPDATE freelancer_profiles SET category_id = $1 WHERE category_id = $2',
        [duplicate.id, original.id]
      );
      
      // Update leads
      const { rowCount: leadUpdates } = await client.query(
        'UPDATE leads SET category_id = $1 WHERE category_id = $2',
        [duplicate.id, original.id]
      );
      
      // Update subscriptions
      const { rowCount: subscriptionUpdates } = await client.query(
        'UPDATE subscriptions SET category_id = $1 WHERE category_id = $2',
        [duplicate.id, original.id]
      );
      
      console.log(`    📝 Updated ${freelancerUpdates} freelancer profiles, ${leadUpdates} leads, ${subscriptionUpdates} subscriptions`);
      
      // Delete the duplicate category
      await client.query('DELETE FROM categories WHERE id = $1', [original.id]);
      console.log(`    🗑️  Deleted duplicate category: "${original.name}"`);
    }
    
    // Step 5: Add missing common categories
    console.log('➕ Adding missing common categories...');
    const { rows: existingCategories } = await client.query(
      'SELECT LOWER(TRIM(name)) as normalized_name FROM categories'
    );
    
    const existingNames = new Set(existingCategories.map(c => c.normalized_name));
    let addedCount = 0;
    
    for (const category of commonCategories) {
      const normalizedName = category.name.toLowerCase().trim();
      
      if (!existingNames.has(normalizedName)) {
        await client.query(
          'INSERT INTO categories (name, icon, color) VALUES ($1, $2, $3)',
          [normalizedName, category.icon, category.color]
        );
        console.log(`  ✅ Added: "${normalizedName}"`);
        addedCount++;
      }
    }
    
    console.log(`📈 Added ${addedCount} new categories`);
    
    // Step 6: Final verification
    const { rows: finalCategories } = await client.query(
      'SELECT id, name, icon, color FROM categories ORDER BY name'
    );
    
    console.log(`\n📊 Final category count: ${finalCategories.length}`);
    console.log('📋 Categories:');
    finalCategories.forEach(category => {
      console.log(`  • ${category.name} ${category.icon}`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Categories cleanup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
cleanCategories()
  .then(() => {
    console.log('🎉 Database cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
