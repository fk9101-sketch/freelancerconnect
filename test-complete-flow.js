// Test script to verify the complete freelancer signup and profile saving flow
const testCompleteFlow = async () => {
  console.log('🚀 Testing complete freelancer signup and profile flow...\n');
  
  // Step 1: Test freelancer signup
  console.log('📝 Step 1: Testing freelancer signup...');
  const signupData = {
    email: 'test.complete@example.com',
    password: 'testpassword123',
    fullName: 'Test Complete User',
    phone: '9876543210',
    professionalTitle: 'Complete Test Professional',
    bio: 'This is a comprehensive test bio for the complete flow testing. It should be long enough to meet all validation requirements and ensure the signup process works correctly.',
    experience: '3-5',
    experienceDescription: 'Complete test experience description for flow testing.',
    hourlyRate: '₹600-900',
    area: 'Vaishali Nagar',
    skills: ['Complete Skill 1', 'Complete Skill 2', 'Complete Skill 3'],
    categoryId: null,
    customCategory: 'Complete Test Category'
  };

  try {
    const signupResponse = await fetch('http://localhost:5001/api/auth/freelancer-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });

    const signupResult = await signupResponse.json();
    
    if (signupResponse.ok) {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupResult.user.id);
      console.log('User Email:', signupResult.user.email);
      
      // Step 2: Test profile creation (simulating what happens when user saves profile)
      console.log('\n📝 Step 2: Testing profile creation...');
      
      const profileData = {
        fullName: 'Test Complete User',
        professionalTitle: 'Complete Test Professional',
        bio: 'This is a comprehensive test bio for the complete flow testing.',
        experience: '3-5',
        experienceDescription: 'Complete test experience description.',
        hourlyRate: '₹600-900',
        area: 'Vaishali Nagar',
        workingAreas: ['Vaishali Nagar', 'Sirsi Road'],
        skills: ['Complete Skill 1', 'Complete Skill 2', 'Complete Skill 3'],
        categoryId: null,
        customCategory: 'Complete Test Category',
        isAvailable: true,
        verificationStatus: 'pending'
      };

      // Note: In a real scenario, this would require authentication
      // For testing, we'll use the test endpoint
      const testProfileData = {
        userId: signupResult.user.id,
        userData: {
          id: signupResult.user.id,
          email: signupResult.user.email,
          firstName: 'Test',
          lastName: 'Complete User',
          role: 'freelancer',
          area: 'Vaishali Nagar',
          phone: '9876543210',
          profileImageUrl: null,
        },
        profileData: profileData
      };

      const profileResponse = await fetch('http://localhost:5001/api/auth/test-freelancer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProfileData)
      });

      const profileResult = await profileResponse.json();
      
      if (profileResponse.ok) {
        console.log('✅ Profile creation successful!');
        console.log('Profile ID:', profileResult.profile.id);
        console.log('Profile User ID:', profileResult.profile.userId);
      } else {
        console.log('❌ Profile creation failed!');
        console.log('Status:', profileResponse.status);
        console.log('Error:', profileResult);
      }
      
    } else {
      console.log('❌ Signup failed!');
      console.log('Status:', signupResponse.status);
      console.log('Error:', signupResult);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
};

// Run the test
testCompleteFlow();
