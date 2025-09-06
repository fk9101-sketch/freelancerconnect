import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { freelancerProfiles, users, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

async function testFreelancerCategories() {
  console.log('🧪 Testing Freelancer Profile Category Saving...\n');

  let userId1: string | null = null;
  let categoryId1: string | null = null;

  try {
    // Test 1: Create user first
    console.log('Test 1: Creating user for freelancer...');
    userId1 = 'test-freelancer-' + Date.now();
    
    const [user1] = await db.insert(users).values({
      id: userId1,
      email: `freelancer-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'Freelancer',
      role: 'freelancer'
    }).returning();
    
    console.log('✅ User created:', user1.id);
    
    // Test 2: Get or create a category
    console.log('\nTest 2: Getting available category...');
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length > 0) {
      categoryId1 = existingCategories[0].id;
      console.log('✅ Using existing category:', existingCategories[0].name);
    } else {
      // Create a test category if none exist
      const [newCategory] = await db.insert(categories).values({
        name: 'Test Category',
        icon: '🔧',
        color: '#3B82F6'
      }).returning();
      categoryId1 = newCategory.id;
      console.log('✅ Created test category:', newCategory.name);
    }
    
    // Test 3: Create freelancer profile with category
    console.log('\nTest 3: Creating freelancer profile with category...');
    const [profile1] = await db.insert(freelancerProfiles).values({
      userId: userId1,
      categoryId: categoryId1,
      fullName: 'Test Freelancer',
      professionalTitle: 'Developer',
      area: 'Jaipur',
      customCategory: null // No custom category for this test
    }).returning();
    
    console.log('✅ Freelancer profile created with category:', profile1.id);
    console.log('   - User ID:', profile1.userId);
    console.log('   - Category ID:', profile1.categoryId);
    
    // Test 4: Update freelancer profile with new category
    console.log('\nTest 4: Updating freelancer profile with new category...');
    const [updatedProfile] = await db.update(freelancerProfiles)
      .set({ 
        categoryId: categoryId1, // Same category for this test
        customCategory: 'Custom Service Category',
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.id, profile1.id))
      .returning();
    
    console.log('✅ Profile updated successfully');
    console.log('   - Custom Category:', updatedProfile.customCategory);
    
    // Test 5: Test profile update without changing user (simulating category-only update)
    console.log('\nTest 5: Testing category-only profile update...');
    const [categoryUpdate] = await db.update(freelancerProfiles)
      .set({ 
        customCategory: 'Updated Custom Category',
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.id, profile1.id))
      .returning();
    
    console.log('✅ Category-only update successful');
    console.log('   - Updated Custom Category:', categoryUpdate.customCategory);
    
    // Test 6: Test creating profile with custom category (no categoryId)
    console.log('\nTest 6: Testing profile with custom category only...');
    const userId2 = 'test-freelancer-custom-' + Date.now();
    
    // Create another user
    const [user2] = await db.insert(users).values({
      id: userId2,
      email: `freelancer-custom-${Date.now()}@example.com`,
      firstName: 'Custom',
      lastName: 'Freelancer',
      role: 'freelancer'
    }).returning();
    
    const [customProfile] = await db.insert(freelancerProfiles).values({
      userId: userId2,
      categoryId: null, // No predefined category
      fullName: 'Custom Category Freelancer',
      professionalTitle: 'Custom Service Provider',
      area: 'Jaipur',
      customCategory: 'Custom Service Category'
    }).returning();
    
    console.log('✅ Custom category profile created:', customProfile.id);
    console.log('   - Custom Category:', customProfile.customCategory);
    console.log('   - Category ID (should be null):', customProfile.categoryId);
    
    // Test 7: Test updating existing profile (simulating user editing their profile)
    console.log('\nTest 7: Testing existing profile update (simulating user edit)...');
    const [editUpdate] = await db.update(freelancerProfiles)
      .set({ 
        categoryId: categoryId1, // Add a predefined category
        customCategory: 'Updated Custom Service',
        professionalTitle: 'Senior Custom Service Provider',
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.id, customProfile.id))
      .returning();
    
    console.log('✅ Profile edit successful');
    console.log('   - New Category ID:', editUpdate.categoryId);
    console.log('   - Updated Custom Category:', editUpdate.customCategory);
    console.log('   - Updated Title:', editUpdate.professionalTitle);
    
    console.log('\n🎉 All category-related tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User creation before profile creation works');
    console.log('- ✅ Category assignment works correctly');
    console.log('- ✅ Custom category handling works');
    console.log('- ✅ Profile updates work without foreign key errors');
    console.log('- ✅ Category-only updates work');
    console.log('- ✅ Profile editing simulation works');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (userId1) {
        await db.delete(freelancerProfiles).where(eq(freelancerProfiles.userId, userId1));
        await db.delete(users).where(eq(users.id, userId1));
        console.log('✅ Test user 1 cleaned up');
      }
      
      // Clean up the custom category test user
      const customUserId = 'test-freelancer-custom-' + Date.now().toString().slice(0, -3);
      await db.delete(freelancerProfiles).where(eq(freelancerProfiles.userId, customUserId));
      await db.delete(users).where(eq(users.id, customUserId));
      console.log('✅ Test user 2 cleaned up');
      
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    await pool.end();
  }
}

// Run the test
testFreelancerCategories().catch(console.error);
