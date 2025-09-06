import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function checkCategoryMismatch() {
  console.log('🔍 Checking Category ID vs Name Mismatch');
  console.log('=======================================');

  try {
    // Get all categories
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categories = await categoriesResponse.json();
    console.log(`📋 Found ${categories.length} categories`);

    // Get all freelancers
    const freelancersResponse = await fetch(`${BASE_URL}/api/freelancers`);
    const freelancers = await freelancersResponse.json();
    console.log(`👥 Found ${freelancers.length} freelancer profiles`);

    // Check category ID vs name mismatch
    console.log('\n🔍 Category ID vs Name Analysis:');
    
    const freelancerCategories = [...new Set(freelancers.map(f => f.categoryId).filter(Boolean))];
    console.log(`📝 Freelancers have ${freelancerCategories.length} unique category values:`);
    freelancerCategories.forEach(cat => {
      console.log(`  "${cat}"`);
    });

    // Check if freelancer categories match actual category IDs
    console.log('\n📋 Category Matching Analysis:');
    let matchedCount = 0;
    let unmatchedCount = 0;

    freelancerCategories.forEach(freelancerCat => {
      const matchingCategory = categories.find(c => c.id === freelancerCat);
      if (matchingCategory) {
        console.log(`✅ "${freelancerCat}" -> Found category: ${matchingCategory.name}`);
        matchedCount++;
      } else {
        console.log(`❌ "${freelancerCat}" -> No matching category ID found`);
        unmatchedCount++;
        
        // Try to find by name
        const byName = categories.find(c => c.name.toLowerCase() === freelancerCat.toLowerCase());
        if (byName) {
          console.log(`   💡 Found by name: ${byName.name} (ID: ${byName.id})`);
        }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Matched: ${matchedCount}`);
    console.log(`  ❌ Unmatched: ${unmatchedCount}`);

    if (unmatchedCount > 0) {
      console.log('\n🚨 ROOT CAUSE FOUND!');
      console.log('Freelancers have category names instead of category IDs.');
      console.log('This breaks the lead matching logic in getFreelancersByCategory().');
    }

    // Show sample categories for reference
    console.log('\n📝 Sample Categories (first 10):');
    categories.slice(0, 10).forEach(cat => {
      console.log(`  ${cat.name} (ID: ${cat.id})`);
    });

  } catch (error) {
    console.error('❌ Error checking categories:', error);
  }
}

checkCategoryMismatch();

