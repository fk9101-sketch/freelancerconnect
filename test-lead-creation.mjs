import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testLeadCreation() {
  try {
    console.log('🧪 Testing lead creation...');
    
    // Test data based on the screenshot
    const testData = {
      title: "tesing",
      description: "testing",
      budgetMin: 9000000000,
      budgetMax: 9000000000,
      location: "Kukas",
      mobileNumber: "+91 0999999999",
      categoryId: "carpenter", // This might be the issue - should be a UUID
      pincode: "",
      preferredTime: "",
      photos: [],
      customerId: "test-user-id"
    };
    
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/customer/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock auth
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Lead creation successful!');
    } else {
      console.log('❌ Lead creation failed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Also test with a valid category ID
async function testWithValidCategory() {
  try {
    console.log('\n🧪 Testing with valid category ID...');
    
    // First get categories to find a valid ID
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categories = await categoriesResponse.json();
    
    if (categories.length > 0) {
      const validCategoryId = categories[0].id;
      console.log('📋 Found valid category ID:', validCategoryId);
      
      const testData = {
        title: "Test Lead",
        description: "Test description",
        budgetMin: 1000,
        budgetMax: 5000,
        location: "Test Area",
        mobileNumber: "+91 1234567890",
        categoryId: validCategoryId,
        pincode: "",
        preferredTime: "",
        photos: [],
        customerId: "test-user-id"
      };
      
      console.log('📤 Sending test data with valid category:', JSON.stringify(testData, null, 2));
      
      const response = await fetch(`${BASE_URL}/api/customer/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('📡 Response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Response body:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test with valid category failed:', error);
  }
}

// Run tests
testLeadCreation().then(() => {
  return testWithValidCategory();
}).catch(console.error);
