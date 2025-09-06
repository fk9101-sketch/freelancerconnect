#!/usr/bin/env node

/**
 * Test script to manually create a position plan subscription
 * This will help debug why position plans are not showing up in My Plans page
 */

import { DatabaseStorage } from './server/storage.js';

const storage = new DatabaseStorage();

async function testManualPositionPlan() {
  console.log('🧪 Testing Manual Position Plan Creation\n');

  try {
    // First, let's see what users and freelancer profiles exist
    console.log('1️⃣ Checking existing users and freelancer profiles...');
    
    // Get all users
    const allUsers = await storage.getAllUsers();
    console.log('All users:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    // Get all freelancer profiles
    const allFreelancers = await storage.getAllFreelancers();
    console.log('All freelancer profiles:', allFreelancers.map(f => ({ 
      id: f.id, 
      userId: f.userId, 
      fullName: f.fullName,
      area: f.area,
      categoryId: f.categoryId
    })));
    
    if (allFreelancers.length === 0) {
      console.log('❌ No freelancer profiles found. Cannot test position plan creation.');
      return;
    }
    
    // Use the first freelancer profile for testing
    const testFreelancer = allFreelancers[0];
    console.log('Using freelancer for testing:', testFreelancer);
    
    // Check existing subscriptions for this freelancer
    console.log('\n2️⃣ Checking existing subscriptions...');
    const existingSubscriptions = await storage.getActiveSubscriptions(testFreelancer.id);
    console.log('Existing active subscriptions:', existingSubscriptions);
    
    // Create a test position plan subscription
    console.log('\n3️⃣ Creating test position plan subscription...');
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Position plans are monthly
    
    const subscriptionData = {
      freelancerId: testFreelancer.id,
      type: 'position',
      status: 'active',
      amount: 1999,
      endDate,
      categoryId: testFreelancer.categoryId || 'test-category',
      area: testFreelancer.area || 'Test Area',
      position: 1
    };
    
    console.log('Creating subscription with data:', subscriptionData);
    const subscription = await storage.createSubscription(subscriptionData);
    console.log('✅ Position subscription created:', subscription);
    
    // Verify the subscription was created
    console.log('\n4️⃣ Verifying subscription creation...');
    const updatedSubscriptions = await storage.getActiveSubscriptions(testFreelancer.id);
    console.log('Updated active subscriptions:', updatedSubscriptions);
    
    // Test the API endpoint that My Plans page uses
    console.log('\n5️⃣ Testing subscription API endpoint...');
    console.log('To test the API endpoint, you would need to:');
    console.log('1. Start the server');
    console.log('2. Make a GET request to /api/freelancer/subscriptions');
    console.log('3. With proper authentication for user:', testFreelancer.userId);
    
    console.log('\n🎯 Manual Position Plan Test Results:');
    console.log('✅ Position subscription creation works');
    console.log('✅ Subscription retrieval works');
    console.log('✅ Freelancer profile exists:', testFreelancer.id);
    console.log('✅ User ID for freelancer:', testFreelancer.userId);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check server logs when accessing My Plans page');
    console.log('2. Verify the user ID matches the freelancer profile user ID');
    console.log('3. Check if the subscription is being fetched correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testManualPositionPlan().catch(console.error);
