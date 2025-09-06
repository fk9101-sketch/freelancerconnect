// Test script to debug freelancer signup issues
const testFreelancerSignupDebug = async () => {
  console.log('🔍 Testing freelancer signup debug...');
  
  const testData = {
    userId: 'test-user-' + Date.now(),
    userData: {
      id: 'test-user-' + Date.now(),
      email: 'test.debug@example.com',
      firstName: 'Test',
      lastName: 'Debug',
      role: 'freelancer',
      area: 'Test Area',
      phone: '9876543210',
      profileImageUrl: null,
    },
    profileData: {
      fullName: 'Test Debug User',
      professionalTitle: 'Test Professional',
      bio: 'This is a test bio for debugging purposes. It should be long enough to meet the minimum requirements.',
      experience: '1-3',
      experienceDescription: 'Test experience description',
      hourlyRate: '₹500-800',
      area: 'Test Area',
      workingAreas: ['Test Area 1', 'Test Area 2'],
      skills: ['Test Skill 1', 'Test Skill 2'],
      profilePhotoUrl: null,
      categoryId: null,
      customCategory: 'Test Category',
      isAvailable: true,
      verificationStatus: 'pending',
    }
  };

  try {
    console.log('📤 Sending test data to debug endpoint...');
    const response = await fetch('http://localhost:5001/api/auth/test-freelancer-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Debug test passed!');
      console.log('User created:', result.user);
      console.log('Profile created:', result.profile);
    } else {
      console.log('❌ Debug test failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Debug test failed with error:', error.message);
  }
};

// Test the actual freelancer signup endpoint
const testActualFreelancerSignup = async () => {
  console.log('\n🔍 Testing actual freelancer signup endpoint...');
  
  const signupData = {
    email: 'test.actual@example.com',
    password: 'testpassword123',
    fullName: 'Test Actual User',
    phone: '9876543210',
    professionalTitle: 'Senior Test Professional',
    bio: 'This is a comprehensive test bio for the actual freelancer signup process. It should be long enough to meet all validation requirements.',
    experience: '3-5',
    experienceDescription: 'Comprehensive test experience description for debugging.',
    hourlyRate: '₹600-900',
    area: 'Test Area',
    skills: ['Test Skill 1', 'Test Skill 2', 'Test Skill 3'],
    categoryId: null,
    customCategory: 'Test Service Category'
  };

  try {
    console.log('📤 Sending signup data to freelancer signup endpoint...');
    const response = await fetch('http://localhost:5001/api/auth/freelancer-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Actual signup test passed!');
      console.log('Response:', result);
    } else {
      console.log('❌ Actual signup test failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Actual signup test failed with error:', error.message);
  }
};

// Run the tests
console.log('🚀 Starting freelancer signup debug tests...\n');
testFreelancerSignupDebug().then(() => {
  setTimeout(() => {
    testActualFreelancerSignup();
  }, 1000);
});
