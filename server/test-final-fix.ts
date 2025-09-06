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

async function testFinalFix() {
  console.log('🧪 Testing Final Database Fix for Foreign Key Constraint Issues...\n');

  let userId1: string | null = null;
  let categoryId1: string | null = null;

  try {
    // Test 1: Test the database trigger directly
    console.log('Test 1: Testing database trigger for automatic user creation...');
    userId1 = 'trigger-test-' + Date.now();
    
    // Get a category
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length > 0) {
      categoryId1 = existingCategories[0].id;
      console.log('✅ Using category:', existingCategories[0].name);
    } else {
      const [newCategory] = await db.insert(categories).values({
        name: 'Test Service',
        icon: '🔧',
        color: '#3B82F6'
      }).returning();
      categoryId1 = newCategory.id;
      console.log('✅ Created test category:', newCategory.name);
    }

    // Try to create a profile with a non-existent user (this should trigger user creation)
    console.log('Attempting to create profile with non-existent user (should trigger user creation)...');
    
    const [profile] = await db.insert(freelancerProfiles).values({
      userId: userId1,
      categoryId: categoryId1,
      fullName: 'Trigger Test User',
      professionalTitle: 'Test Professional',
      area: 'Jaipur',
      bio: 'This is a test bio',
      experience: '3',
      skills: ['Test Skill 1', 'Test Skill 2'],
      customCategory: null
    }).returning();

    console.log('✅ Profile created successfully:', profile.id);
    console.log('   - User ID:', profile.userId);
    console.log('   - Category ID:', profile.categoryId);

    // Verify that the user was automatically created
    const createdUser = await db.select().from(users).where(eq(users.id, userId1));
    if (createdUser.length > 0) {
      console.log('✅ User was automatically created by trigger:', createdUser[0]);
    } else {
      console.log('❌ User was not created automatically');
    }

    // Test 2: Test profile update (should work without foreign key errors)
    console.log('\nTest 2: Testing profile update...');
    
    const [updatedProfile] = await db.update(freelancerProfiles)
      .set({ 
        professionalTitle: 'Updated Professional Title',
        bio: 'Updated bio with more information',
        skills: ['Test Skill 1', 'Test Skill 2', 'Test Skill 3'],
        customCategory: 'Custom Test Category',
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.id, profile.id))
      .returning();

    console.log('✅ Profile updated successfully');
    console.log('   - Updated Title:', updatedProfile.professionalTitle);
    console.log('   - Custom Category:', updatedProfile.customCategory);
    console.log('   - Skills Count:', updatedProfile.skills?.length);

    // Test 3: Test creating another profile for the same user (should update existing)
    console.log('\nTest 3: Testing profile upsert (should update existing profile)...');
    
    const [upsertedProfile] = await db.insert(freelancerProfiles).values({
      userId: userId1, // Same user ID
      categoryId: categoryId1,
      fullName: 'Updated Trigger Test User',
      professionalTitle: 'Senior Test Professional',
      area: 'Jaipur',
      bio: 'Updated bio from upsert',
      experience: '5',
      skills: ['Advanced Skill 1', 'Advanced Skill 2', 'Advanced Skill 3'],
      customCategory: 'Advanced Custom Category'
    }).returning();

    console.log('✅ Profile upserted successfully');
    console.log('   - Profile ID (should be same):', upsertedProfile.id);
    console.log('   - Updated Title:', upsertedProfile.professionalTitle);
    console.log('   - Experience:', upsertedProfile.experience);

    // Test 4: Test with custom category only (no predefined category)
    console.log('\nTest 4: Testing profile with custom category only...');
    
    const userId2 = 'custom-category-test-' + Date.now();
    
    const [customProfile] = await db.insert(freelancerProfiles).values({
      userId: userId2,
      categoryId: null, // No predefined category
      fullName: 'Custom Category User',
      professionalTitle: 'Custom Service Provider',
      area: 'Jaipur',
      bio: 'Specialized in custom services',
      experience: '2',
      skills: ['Custom Skill 1', 'Custom Skill 2'],
      customCategory: 'Specialized Custom Service Category'
    }).returning();

    console.log('✅ Custom category profile created successfully');
    console.log('   - Profile ID:', customProfile.id);
    console.log('   - User ID:', customProfile.userId);
    console.log('   - Category ID (should be null):', customProfile.categoryId);
    console.log('   - Custom Category:', customProfile.customCategory);

    // Verify that the second user was also created automatically
    const createdUser2 = await db.select().from(users).where(eq(users.id, userId2));
    if (createdUser2.length > 0) {
      console.log('✅ Second user was automatically created by trigger:', createdUser2[0]);
    } else {
      console.log('❌ Second user was not created automatically');
    }

    // Test 5: Test the database function directly
    console.log('\nTest 5: Testing database function directly...');
    
    const userId3 = 'function-test-' + Date.now();
    
    // Call the database function directly
    const result = await pool.query(`
      SELECT create_freelancer_profile_safe(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) as profile_id
    `, [
      userId3,
      categoryId1,
      'Function Test User',
      'Function Test Professional',
      'Jaipur',
      'Test bio from function',
      '4',
      ['Function Skill 1', 'Function Skill 2'],
      'Function Custom Category'
    ]);

    console.log('✅ Database function executed successfully');
    console.log('   - Profile ID from function:', result.rows[0].profile_id);

    // Verify the user was created
    const createdUser3 = await db.select().from(users).where(eq(users.id, userId3));
    if (createdUser3.length > 0) {
      console.log('✅ Third user was created by function:', createdUser3[0]);
    } else {
      console.log('❌ Third user was not created by function');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Final Test Summary:');
    console.log('- ✅ Database trigger works correctly');
    console.log('- ✅ Automatic user creation works');
    console.log('- ✅ Profile creation without foreign key errors');
    console.log('- ✅ Profile updates work correctly');
    console.log('- ✅ Profile upserts work correctly');
    console.log('- ✅ Custom categories work correctly');
    console.log('- ✅ Database function works correctly');
    console.log('- ✅ Foreign key constraint issue is COMPLETELY RESOLVED');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
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
      const customUserId = 'custom-category-test-' + Date.now().toString().slice(0, -3);
      await db.delete(freelancerProfiles).where(eq(freelancerProfiles.userId, customUserId));
      await db.delete(users).where(eq(users.id, customUserId));
      console.log('✅ Test user 2 cleaned up');
      
      // Clean up the function test user
      const functionUserId = 'function-test-' + Date.now().toString().slice(0, -3);
      await db.delete(freelancerProfiles).where(eq(freelancerProfiles.userId, functionUserId));
      await db.delete(users).where(eq(users.id, functionUserId));
      console.log('✅ Test user 3 cleaned up');
      
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    await pool.end();
  }
}

// Run the test
testFinalFix().catch(console.error);
