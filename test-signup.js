// Test script for freelancer signup
const testSignup = async () => {
  console.log('Testing freelancer signup endpoint...');
  
  const testData = {
    email: 'test.freelancer@example.com',
    password: 'testpassword123',
    fullName: 'Test Freelancer',
    phone: '9876543210',
    professionalTitle: 'Senior Electrician',
    bio: 'Experienced electrician with 8+ years of expertise in residential and commercial electrical work. Specialized in LED installations, circuit repairs, and panel upgrades.',
    experience: '5-10',
    experienceDescription: 'Started as an apprentice and worked my way up to handling complex electrical installations.',
    hourlyRate: '₹500-800',
    area: 'Vaishali Nagar',
    workingAreas: ['Vaishali Nagar', 'Sirsi Road'],
    skills: ['Electrical Installation', 'Circuit Repair', 'LED Installation'],
    profilePhotoUrl: '',
    categoryId: null,
    customCategory: 'Electrician'
  };

  try {
    const response = await fetch('http://localhost:5001/api/auth/freelancer-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup test passed!');
      console.log('Response:', result);
      console.log('\nNow you can login with:');
      console.log('Email: test.freelancer@example.com');
      console.log('Password: testpassword123');
    } else {
      console.log('❌ Signup test failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Signup test failed with error:', error.message);
  }
};

// Run the test
testSignup();
