import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testLeadMatchingLogic() {
  console.log('🔍 Testing Lead Matching Logic');
  console.log('===============================');

  try {
    // Get categories and freelancers
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categories = await categoriesResponse.json();
    
    const freelancersResponse = await fetch(`${BASE_URL}/api/freelancers`);
    const freelancers = await freelancersResponse.json();

    // Find a category with ready freelancers
    const readyFreelancers = freelancers.filter(f => 
      f.verificationStatus === 'approved' && 
      f.isAvailable === true && 
      f.area && 
      f.categoryId
    );

    if (readyFreelancers.length === 0) {
      console.log('❌ No ready freelancers found');
      return;
    }

    // Use the first ready freelancer's category and area
    const testFreelancer = readyFreelancers[0];
    const testCategory = categories.find(c => c.id === testFreelancer.categoryId);
    
    console.log(`📝 Testing with:`);
    console.log(`  Category: ${testCategory?.name} (${testCategory?.id})`);
    console.log(`  Area: ${testFreelancer.area}`);
    console.log(`  Freelancer: ${testFreelancer.fullName}`);

    // Check how many freelancers should match this category and area
    const matchingFreelancers = freelancers.filter(f => 
      f.categoryId === testCategory?.id && 
      f.area === testFreelancer.area &&
      f.verificationStatus === 'approved' && 
      f.isAvailable === true
    );

    console.log(`\n📊 Expected Matching:`);
    console.log(`  Freelancers in same category & area: ${matchingFreelancers.length}`);
    matchingFreelancers.forEach(f => {
      console.log(`    - ${f.fullName} (${f.area})`);
    });

    // Test the getFreelancersByCategory function logic
    console.log('\n🔍 Testing getFreelancersByCategory Logic:');
    
    // Simulate the exact query from the function
    const conditions = [
      `categoryId = '${testCategory?.id}'`,
      `verificationStatus = 'approved'`,
      `isAvailable = true`,
      `LOWER(area) = LOWER('${testFreelancer.area}')`
    ];

    console.log('  Conditions:');
    conditions.forEach(condition => {
      console.log(`    ${condition}`);
    });

    // Check if any freelancers match these conditions
    const matchingByLogic = freelancers.filter(f => 
      f.categoryId === testCategory?.id &&
      f.verificationStatus === 'approved' &&
      f.isAvailable === true &&
      f.area?.toLowerCase() === testFreelancer.area?.toLowerCase()
    );

    console.log(`\n📊 Actual Matching by Logic:`);
    console.log(`  Found: ${matchingByLogic.length} freelancers`);
    matchingByLogic.forEach(f => {
      console.log(`    - ${f.fullName} (${f.area})`);
    });

    if (matchingByLogic.length === 0) {
      console.log('\n❌ PROBLEM: No freelancers match the exact logic!');
      console.log('   This explains why leads are not being delivered.');
      
      // Debug each condition
      console.log('\n🔍 Debugging each condition:');
      const categoryMatch = freelancers.filter(f => f.categoryId === testCategory?.id);
      console.log(`  Category match: ${categoryMatch.length} freelancers`);
      
      const verifiedMatch = categoryMatch.filter(f => f.verificationStatus === 'approved');
      console.log(`  + Verified: ${verifiedMatch.length} freelancers`);
      
      const availableMatch = verifiedMatch.filter(f => f.isAvailable === true);
      console.log(`  + Available: ${availableMatch.length} freelancers`);
      
      const areaMatch = availableMatch.filter(f => 
        f.area?.toLowerCase() === testFreelancer.area?.toLowerCase()
      );
      console.log(`  + Area match: ${areaMatch.length} freelancers`);
      
    } else {
      console.log('\n✅ Freelancers match the logic correctly');
      console.log('   The issue might be in the lead creation or notification logic.');
    }

    // Test area case sensitivity
    console.log('\n🔍 Testing Area Case Sensitivity:');
    const areas = [...new Set(freelancers.map(f => f.area).filter(Boolean))];
    const testAreaLower = testFreelancer.area?.toLowerCase();
    
    const exactAreaMatch = freelancers.filter(f => f.area === testFreelancer.area);
    const caseInsensitiveMatch = freelancers.filter(f => 
      f.area?.toLowerCase() === testAreaLower
    );
    
    console.log(`  Exact area match: ${exactAreaMatch.length} freelancers`);
    console.log(`  Case-insensitive match: ${caseInsensitiveMatch.length} freelancers`);
    
    if (exactAreaMatch.length !== caseInsensitiveMatch.length) {
      console.log('⚠️ Case sensitivity issue detected in area matching');
    }

  } catch (error) {
    console.error('❌ Error testing lead matching:', error);
  }
}

testLeadMatchingLogic();

