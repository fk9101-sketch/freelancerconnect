import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function checkExistingLeads() {
  console.log('🔍 Checking Existing Leads');
  console.log('==========================');

  try {
    // Try to get leads from different endpoints
    const endpoints = [
      '/api/leads',
      '/api/customer/leads',
      '/api/freelancer/leads/available',
      '/api/freelancer/leads/accepted'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'N/A'} items`);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   Sample: ${data[0].title || data[0].id}`);
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }

    // Check if there are any leads in the database by looking at the storage
    console.log('\n📋 Checking Database for Leads:');
    
    // Try to access the database directly through a test endpoint
    try {
      const testResponse = await fetch(`${BASE_URL}/api/test/leads`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`✅ Test endpoint: ${testData.count || 0} leads`);
      } else {
        console.log('❌ Test endpoint not available');
      }
    } catch (error) {
      console.log('❌ Test endpoint error:', error.message);
    }

    // Check if the issue is that no leads have been created yet
    console.log('\n🎯 Analysis:');
    console.log('If no leads exist, this could explain why freelancers are not receiving notifications.');
    console.log('The system might be working correctly, but no customers have posted requirements yet.');

  } catch (error) {
    console.error('❌ Error checking leads:', error);
  }
}

checkExistingLeads();

