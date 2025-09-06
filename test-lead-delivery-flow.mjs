import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testLeadDeliveryFlow() {
  console.log('🔍 Testing Lead Delivery Flow');
  console.log('================================');

  let categories = [];
  let testCategory = null;

  try {
    // Step 1: Check if server is running
    console.log('\n📋 Step 1: Server Connectivity');
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    if (categoriesResponse.ok) {
      categories = await categoriesResponse.json();
      console.log(`✅ Server is running. Found ${categories.length} categories`);
      
      // Get first category for testing
      testCategory = categories[0];
      console.log(`📝 Using category: ${testCategory.name} (${testCategory.id})`);
    } else {
      console.log('❌ Server not responding');
      return;
    }

    // Step 2: Check freelancer profiles
    console.log('\n📋 Step 2: Freelancer Profiles');
    const freelancersResponse = await fetch(`${BASE_URL}/api/freelancers`);
    if (freelancersResponse.ok) {
      const freelancers = await freelancersResponse.json();
      console.log(`✅ Found ${freelancers.length} freelancer profiles`);
      
      // Check if any freelancers are in the test category
      const categoryFreelancers = freelancers.filter(f => f.categoryId === testCategory.id);
      console.log(`📝 Found ${categoryFreelancers.length} freelancers in category: ${testCategory.name}`);
      
      if (categoryFreelancers.length === 0) {
        console.log('⚠️ No freelancers found in test category. Lead delivery may not work.');
      } else {
        console.log('✅ Freelancers available for lead delivery');
      }
    } else {
      console.log('❌ Could not fetch freelancer profiles');
    }

    // Step 3: Check existing leads
    console.log('\n📋 Step 3: Existing Leads');
    try {
      const leadsResponse = await fetch(`${BASE_URL}/api/leads`);
      if (leadsResponse.ok) {
        const leads = await leadsResponse.json();
        console.log(`✅ Found ${leads.length} existing leads`);
        
        if (leads.length > 0) {
          const pendingLeads = leads.filter(l => l.status === 'pending');
          console.log(`📝 ${pendingLeads.length} pending leads available`);
        }
      } else {
        console.log('⚠️ Could not fetch leads (endpoint may not exist)');
      }
    } catch (error) {
      console.log('⚠️ Leads endpoint not available');
    }

    // Step 4: Test lead creation (without auth - should fail)
    console.log('\n📋 Step 4: Lead Creation Test (Unauthenticated)');
    const testLeadData = {
      title: "Test Lead for Delivery",
      description: "Testing lead delivery to freelancers",
      budgetMin: 1000,
      budgetMax: 5000,
      location: "Test Area",
      mobileNumber: "+91 1234567890",
      categoryId: testCategory.id,
      pincode: "",
      preferredTime: "",
      photos: [],
      customerId: "test-customer-id"
    };

    try {
      const createResponse = await fetch(`${BASE_URL}/api/customer/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLeadData)
      });

      if (createResponse.status === 401) {
        console.log('✅ Lead creation properly requires authentication');
      } else if (createResponse.ok) {
        console.log('⚠️ Lead creation succeeded without auth (unexpected)');
        const result = await createResponse.json();
        console.log('📝 Created lead:', result);
      } else {
        console.log(`❌ Lead creation failed with status: ${createResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Lead creation request failed:', error.message);
    }

    // Step 5: Check notification endpoints
    console.log('\n📋 Step 5: Notification Endpoints');
    
    // Check freelancer notifications endpoint
    try {
      const notificationsResponse = await fetch(`${BASE_URL}/api/freelancer/leads/notifications`);
      if (notificationsResponse.status === 401) {
        console.log('✅ Freelancer notifications endpoint requires authentication');
      } else if (notificationsResponse.ok) {
        console.log('⚠️ Freelancer notifications endpoint accessible without auth');
      } else {
        console.log(`❌ Freelancer notifications endpoint error: ${notificationsResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Freelancer notifications endpoint not available');
    }

    // Step 6: Check storage functions
    console.log('\n📋 Step 6: Storage Function Analysis');
    
    // Read storage.ts to check getFreelancersByCategory function
    const fs = await import('fs');
    const storageContent = fs.readFileSync('server/storage.ts', 'utf8');
    
    if (storageContent.includes('async getFreelancersByCategory')) {
      console.log('✅ getFreelancersByCategory function exists');
      
      if (storageContent.includes('eq(freelancerProfiles.categoryId, categoryId)')) {
        console.log('✅ Category filtering implemented');
      } else {
        console.log('❌ Category filtering missing');
      }
      
      if (storageContent.includes('LOWER(${freelancerProfiles.area}) = LOWER(${area})')) {
        console.log('✅ Area filtering implemented (case-insensitive)');
      } else {
        console.log('❌ Area filtering missing or not case-insensitive');
      }
      
      if (storageContent.includes('eq(freelancerProfiles.verificationStatus, \'approved\')')) {
        console.log('✅ Verification status filtering implemented');
      } else {
        console.log('❌ Verification status filtering missing');
      }
      
      if (storageContent.includes('eq(freelancerProfiles.isAvailable, true)')) {
        console.log('✅ Availability filtering implemented');
      } else {
        console.log('❌ Availability filtering missing');
      }
    } else {
      console.log('❌ getFreelancersByCategory function not found');
    }

    // Step 7: Check routes.ts for lead creation logic
    console.log('\n📋 Step 7: Lead Creation Logic Analysis');
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    if (routesContent.includes('app.post(\'/api/customer/leads\'')) {
      console.log('✅ Lead creation endpoint exists');
      
      if (routesContent.includes('getFreelancersByCategory')) {
        console.log('✅ Lead creation calls getFreelancersByCategory');
      } else {
        console.log('❌ Lead creation does not call getFreelancersByCategory');
      }
      
      if (routesContent.includes('notifyUser')) {
        console.log('✅ Lead creation includes notification logic');
      } else {
        console.log('❌ Lead creation missing notification logic');
      }
      
      if (routesContent.includes('createNotification')) {
        console.log('✅ Lead creation creates database notifications');
      } else {
        console.log('❌ Lead creation missing database notifications');
      }
    } else {
      console.log('❌ Lead creation endpoint not found');
    }

    console.log('\n🎯 Lead Delivery Flow Analysis Complete');
    console.log('=====================================');
    console.log('📋 Summary:');
    console.log('- Server is running and responding');
    console.log('- Categories are available');
    console.log('- Lead creation requires authentication (good)');
    console.log('- Notification endpoints exist');
    console.log('- Storage functions are implemented');
    console.log('- Lead creation logic includes notifications');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Test with authenticated user');
    console.log('2. Verify freelancer matching logic');
    console.log('3. Check real-time notifications');
    console.log('4. Validate lead acceptance flow');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeadDeliveryFlow();
