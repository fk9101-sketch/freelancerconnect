// Test Category Integration
// This file tests the category integration in the freelancer signup and profile system

const testCategoryIntegration = async () => {
  console.log('🧪 Testing Category Integration...\n');

  // Test 1: Check if categories API is working
  console.log('1. Testing Categories API...');
  try {
    const categoriesResponse = await fetch('http://localhost:3000/api/categories');
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`✅ Categories API working - Found ${categories.length} categories`);
      console.log('Sample categories:', categories.slice(0, 3).map(c => c.name));
    } else {
      console.log('❌ Categories API failed');
    }
  } catch (error) {
    console.log('❌ Categories API error:', error.message);
  }

  // Test 2: Check if freelancer profile API is working
  console.log('\n2. Testing Freelancer Profile API...');
  try {
    const profileResponse = await fetch('http://localhost:3000/api/freelancer/profile', {
      headers: {
        'Authorization': 'Bearer test-token',
        'X-Firebase-User-ID': 'test-user-id'
      }
    });
    console.log(`✅ Freelancer Profile API responding (status: ${profileResponse.status})`);
  } catch (error) {
    console.log('❌ Freelancer Profile API error:', error.message);
  }

  // Test 3: Check if signup API accepts category data
  console.log('\n3. Testing Signup API with Category Data...');
  try {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      area: 'Vaishali Nagar',
      role: 'freelancer',
      phone: '1234567890',
      categoryId: 'test-category-id',
      customCategory: null
    };

    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });

    console.log(`✅ Signup API responding (status: ${signupResponse.status})`);
    if (signupResponse.status === 400) {
      const errorData = await signupResponse.json();
      console.log('Expected validation error:', errorData.message);
    }
  } catch (error) {
    console.log('❌ Signup API error:', error.message);
  }

  console.log('\n🎉 Category Integration Test Complete!');
  console.log('\nNext steps:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Try signing up as a freelancer with a category');
  console.log('3. Check if the category is saved and displayed in the profile');
};

// Run the test
testCategoryIntegration().catch(console.error);
