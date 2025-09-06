import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function checkFreelancers() {
  console.log('🔍 Checking Freelancer Data');
  console.log('===========================');

  try {
    // Get all categories
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categories = await categoriesResponse.json();
    console.log(`📋 Found ${categories.length} categories`);

    // Get all freelancers
    const freelancersResponse = await fetch(`${BASE_URL}/api/freelancers`);
    const freelancers = await freelancersResponse.json();
    console.log(`👥 Found ${freelancers.length} freelancer profiles`);

    // Analyze freelancer distribution by category
    const categoryDistribution = {};
    freelancers.forEach(freelancer => {
      const categoryId = freelancer.categoryId;
      if (!categoryDistribution[categoryId]) {
        categoryDistribution[categoryId] = 0;
      }
      categoryDistribution[categoryId]++;
    });

    console.log('\n📊 Freelancer Distribution by Category:');
    Object.entries(categoryDistribution).forEach(([categoryId, count]) => {
      const category = categories.find(c => c.id === categoryId);
      const categoryName = category ? category.name : 'Unknown';
      console.log(`  ${categoryName}: ${count} freelancers`);
    });

    // Check freelancer verification and availability status
    console.log('\n📋 Freelancer Status Analysis:');
    const verifiedCount = freelancers.filter(f => f.verificationStatus === 'approved').length;
    const availableCount = freelancers.filter(f => f.isAvailable === true).length;
    const verifiedAndAvailable = freelancers.filter(f => 
      f.verificationStatus === 'approved' && f.isAvailable === true
    ).length;

    console.log(`  ✅ Verified: ${verifiedCount}/${freelancers.length}`);
    console.log(`  ✅ Available: ${availableCount}/${freelancers.length}`);
    console.log(`  ✅ Verified & Available: ${verifiedAndAvailable}/${freelancers.length}`);

    // Check areas
    console.log('\n📍 Area Analysis:');
    const areas = [...new Set(freelancers.map(f => f.area).filter(Boolean))];
    console.log(`  📍 Unique areas: ${areas.length}`);
    areas.slice(0, 10).forEach(area => {
      const count = freelancers.filter(f => f.area === area).length;
      console.log(`    ${area}: ${count} freelancers`);
    });

    // Check for any freelancers that could receive leads
    console.log('\n🎯 Lead Delivery Readiness:');
    const readyFreelancers = freelancers.filter(f => 
      f.verificationStatus === 'approved' && 
      f.isAvailable === true && 
      f.area && 
      f.categoryId
    );
    console.log(`  🎯 Ready to receive leads: ${readyFreelancers.length}/${freelancers.length}`);

    if (readyFreelancers.length === 0) {
      console.log('\n❌ PROBLEM: No freelancers are ready to receive leads!');
      console.log('   This explains why leads are not reaching freelancers.');
    } else {
      console.log('\n✅ Freelancers are ready to receive leads');
      console.log('   The issue might be in the lead creation or matching logic.');
    }

    // Show sample ready freelancer
    if (readyFreelancers.length > 0) {
      const sample = readyFreelancers[0];
      const category = categories.find(c => c.id === sample.categoryId);
      console.log('\n📝 Sample Ready Freelancer:');
      console.log(`  Name: ${sample.fullName}`);
      console.log(`  Category: ${category?.name || 'Unknown'}`);
      console.log(`  Area: ${sample.area}`);
      console.log(`  Status: ${sample.verificationStatus}`);
      console.log(`  Available: ${sample.isAvailable}`);
    }

  } catch (error) {
    console.error('❌ Error checking freelancers:', error);
  }
}

checkFreelancers();

