import { storage } from './storage';
import { db } from './db';
import { categories, freelancerProfiles } from '@shared/schema';

async function testCategoryIntegration() {
  console.log('=== Testing Category Integration ===');
  
  try {
    // 1. Test getting categories
    console.log('\n1. Testing categories fetch...');
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    const categoriesData = await categoriesResponse.json();
    console.log('Categories available:', categoriesData.length);
    console.log('Sample category:', categoriesData[0]);
    
    // 2. Test creating a freelancer profile with category
    console.log('\n2. Testing freelancer profile creation with category...');
    const testUserId = 'test-user-category-' + Date.now();
    
    // First create a user
    await storage.ensureUserExists(testUserId, {
      id: testUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'freelancer'
    });
    
    // Create profile with category
    const profileData = {
      userId: testUserId,
      categoryId: categoriesData[0].id, // Use first category
      fullName: 'Test Freelancer',
      professionalTitle: 'Test Professional',
      bio: 'Test bio',
      experience: '5',
      hourlyRate: '₹500',
      workingAreas: ['Jaipur'],
      area: 'Jaipur'
    };
    
    const createdProfile = await storage.upsertFreelancerProfile(testUserId, profileData);
    console.log('Profile created with category:', {
      id: createdProfile.id,
      categoryId: createdProfile.categoryId,
      fullName: createdProfile.fullName
    });
    
    // 3. Test getting profile with category
    console.log('\n3. Testing profile fetch with category...');
    const profileWithCategory = await storage.getFreelancerProfileWithCategory(testUserId);
    console.log('Profile with category:', {
      id: profileWithCategory?.id,
      categoryId: profileWithCategory?.categoryId,
      categoryName: profileWithCategory?.category?.name,
      fullName: profileWithCategory?.fullName
    });
    
    // 4. Test updating profile with different category
    console.log('\n4. Testing profile update with different category...');
    if (categoriesData.length > 1) {
      const updateData = {
        categoryId: categoriesData[1].id // Use second category
      };
      
      await storage.updateFreelancerProfile(createdProfile.id, updateData);
      console.log('Profile updated with new category ID:', categoriesData[1].id);
      
      // Verify the update
      const updatedProfile = await storage.getFreelancerProfileWithCategory(testUserId);
      console.log('Updated profile with category:', {
        id: updatedProfile?.id,
        categoryId: updatedProfile?.categoryId,
        categoryName: updatedProfile?.category?.name
      });
    }
    
    // 5. Test custom category
    console.log('\n5. Testing custom category...');
    const customCategoryData = {
      ...profileData,
      categoryId: null,
      customCategory: 'Custom Test Category'
    };
    
    await storage.updateFreelancerProfile(createdProfile.id, customCategoryData);
    const customProfile = await storage.getFreelancerProfileWithCategory(testUserId);
    console.log('Profile with custom category:', {
      id: customProfile?.id,
      categoryId: customProfile?.categoryId,
      customCategory: customProfile?.customCategory
    });
    
    console.log('\n=== Category Integration Test Completed Successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCategoryIntegration();
}

export { testCategoryIntegration };
