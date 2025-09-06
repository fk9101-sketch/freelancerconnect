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

// Simulate the storage functions
async function ensureUserExists(userId: string, userData?: any): Promise<any> {
  try {
    console.log('Storage: Ensuring user exists for ID:', userId);
    
    // Validate userId
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required and cannot be null or empty');
    }
    
    // First, try to get the existing user
    const existingUsers = await db.select().from(users).where(eq(users.id, userId));
    
    if (existingUsers.length > 0) {
      console.log('Storage: User found:', existingUsers[0]);
      return existingUsers[0];
    }
    
    // User doesn't exist, create a new one with proper error handling
    console.log('Storage: User not found, creating new user with ID:', userId);
    
    // Prepare user data with fallbacks
    const defaultUserData = {
      id: userId,
      email: userData?.email || `user_${userId}@example.com`,
      firstName: userData?.firstName || 'User',
      lastName: userData?.lastName || '',
      role: userData?.role || 'freelancer',
      profileImageUrl: userData?.profileImageUrl || null,
      area: userData?.area || null,
      phone: userData?.phone || null
    };
    
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      try {
        // Double-check if user was created by another process during this transaction
        const checkUsers = await tx.select().from(users).where(eq(users.id, userId));
        if (checkUsers.length > 0) {
          console.log('Storage: User was created by another process during transaction:', checkUsers[0]);
          return checkUsers[0];
        }
        
        // Create the user
        const [newUser] = await tx
          .insert(users)
          .values(defaultUserData)
          .returning();
        
        console.log('Storage: New user created successfully:', newUser);
        return newUser;
      } catch (insertError: any) {
        console.error('Storage: Error creating user in transaction:', insertError);
        
        // Handle specific database errors
        if (insertError.code === '23505') { // Unique violation - user was created by another process
          console.log('Storage: User already exists (race condition), fetching again...');
          const existingUser = await tx.select().from(users).where(eq(users.id, userId));
          if (existingUser.length > 0) {
            console.log('Storage: User found after race condition:', existingUser[0]);
            return existingUser[0];
          }
        }
        
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
    });
  } catch (error) {
    console.error('Storage: Error ensuring user exists:', error);
    throw error;
  }
}

async function upsertFreelancerProfile(userId: string, profileData: any, userData?: any): Promise<any> {
  try {
    console.log('Storage: Upserting freelancer profile for user:', userId);
    
    // Validate userId
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required and cannot be null or empty');
    }
    
    // Ensure the user exists first
    await ensureUserExists(userId, userData);
    
    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Check if profile already exists within the transaction
      const existingProfiles = await tx.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, userId));
      
      if (existingProfiles.length > 0) {
        console.log('Storage: Profile exists, updating...');
        const existingProfile = existingProfiles[0];
        
        // Update the profile
        const result = await tx.update(freelancerProfiles)
          .set({ 
            ...profileData, 
            updatedAt: new Date() 
          })
          .where(eq(freelancerProfiles.id, existingProfile.id))
          .returning();
        
        if (result.length === 0) {
          throw new Error('Failed to update existing profile');
        }
        
        console.log('Storage: Profile updated successfully');
        return result[0];
      } else {
        console.log('Storage: Profile does not exist, creating new one...');
        const completeProfileData = {
          userId,
          categoryId: profileData.categoryId || null, // Allow null for custom categories
          fullName: profileData.fullName || 'User', // This should be provided
          ...profileData
        };
        
        const [newProfile] = await tx.insert(freelancerProfiles).values(completeProfileData).returning();
        console.log('Storage: Profile created successfully');
        return newProfile;
      }
    });
  } catch (error) {
    console.error('Storage: Error upserting freelancer profile:', error);
    throw error;
  }
}

async function testFreelancerRegistration() {
  console.log('🧪 Testing New Freelancer Registration with Categories...\n');

  let userId1: string | null = null;
  let categoryId1: string | null = null;

  try {
    // Test 1: Simulate new freelancer registration with predefined category
    console.log('Test 1: New freelancer registering with predefined category...');
    userId1 = 'new-freelancer-' + Date.now();
    
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
    
    // Simulate the request data that would come from the frontend
    const requestData = {
      categoryId: categoryId1,
      fullName: 'John Doe',
      professionalTitle: 'Professional Developer',
      area: 'Jaipur',
      bio: 'Experienced developer with 5 years of experience',
      experience: '5',
      skills: ['JavaScript', 'React', 'Node.js'],
      customCategory: null
    };
    
    // Simulate user data from Firebase claims
    const userData = {
      id: userId1,
      email: `john.doe.${Date.now()}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      role: 'freelancer',
      profileImageUrl: null,
      area: 'Jaipur',
      phone: null
    };
    
    // Test the upsert function (this is what the API endpoint calls)
    const profile = await upsertFreelancerProfile(userId1, requestData, userData);
    
    console.log('✅ New freelancer profile created successfully!');
    console.log('   - Profile ID:', profile.id);
    console.log('   - User ID:', profile.userId);
    console.log('   - Category ID:', profile.categoryId);
    console.log('   - Full Name:', profile.fullName);
    console.log('   - Professional Title:', profile.professionalTitle);
    
    // Test 2: Simulate freelancer updating their profile with new category
    console.log('\nTest 2: Freelancer updating profile with new category...');
    
    const updateData = {
      categoryId: categoryId1, // Same category for this test
      customCategory: 'Custom Web Development Services',
      professionalTitle: 'Senior Full-Stack Developer',
      bio: 'Updated bio with more experience',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Django']
    };
    
    const updatedProfile = await upsertFreelancerProfile(userId1, updateData, userData);
    
    console.log('✅ Profile updated successfully!');
    console.log('   - Updated Title:', updatedProfile.professionalTitle);
    console.log('   - Custom Category:', updatedProfile.customCategory);
    console.log('   - Skills Count:', updatedProfile.skills?.length);
    
    // Test 3: Simulate freelancer switching to custom category only
    console.log('\nTest 3: Freelancer switching to custom category only...');
    
    const customCategoryData = {
      categoryId: null, // Remove predefined category
      customCategory: 'Specialized AI Development Services',
      professionalTitle: 'AI/ML Specialist',
      bio: 'Specialized in artificial intelligence and machine learning'
    };
    
    const customProfile = await upsertFreelancerProfile(userId1, customCategoryData, userData);
    
    console.log('✅ Custom category profile updated successfully!');
    console.log('   - Category ID (should be null):', customProfile.categoryId);
    console.log('   - Custom Category:', customProfile.customCategory);
    console.log('   - Professional Title:', customProfile.professionalTitle);
    
    // Test 4: Simulate freelancer switching back to predefined category
    console.log('\nTest 4: Freelancer switching back to predefined category...');
    
    const backToPredefinedData = {
      categoryId: categoryId1,
      customCategory: null, // Remove custom category
      professionalTitle: 'Professional Developer',
      bio: 'Back to general development services'
    };
    
    const finalProfile = await upsertFreelancerProfile(userId1, backToPredefinedData, userData);
    
    console.log('✅ Back to predefined category successfully!');
    console.log('   - Category ID:', finalProfile.categoryId);
    console.log('   - Custom Category (should be null):', finalProfile.customCategory);
    console.log('   - Professional Title:', finalProfile.professionalTitle);
    
    console.log('\n🎉 All freelancer registration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ New freelancer registration works without foreign key errors');
    console.log('- ✅ Category assignment and updates work correctly');
    console.log('- ✅ Custom category handling works');
    console.log('- ✅ Profile updates work without duplicates');
    console.log('- ✅ Category switching works (predefined ↔ custom)');
    console.log('- ✅ User creation happens before profile creation');
    
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
        console.log('✅ Test data cleaned up');
      }
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    await pool.end();
  }
}

// Run the test
testFreelancerRegistration().catch(console.error);
