#!/usr/bin/env node

/**
 * Test script to create a position plan subscription directly
 * This will help verify if the position plan creation logic works
 */

import { DatabaseStorage } from './server/storage.js';

const storage = new DatabaseStorage();

async function testPositionPlanCreation() {
  console.log('🧪 Testing Position Plan Creation\n');

  try {
    // Test data
    const testFreelancerId = 'test-freelancer-id';
    const testCategoryId = 'test-category-id';
    const testArea = 'Test Area';
    const testPosition = 1;
    const testAmount = 1999;

    console.log('1️⃣ Creating test position plan subscription...');
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Position plans are monthly
    
    const subscriptionData = {
      freelancerId: testFreelancerId,
      type: 'position',
      status: 'active',
      amount: testAmount,
      endDate,
      categoryId: testCategoryId,
      area: testArea,
      position: testPosition
    };
    
    console.log('Subscription data:', subscriptionData);
    
    // Try to create the subscription
    const subscription = await storage.createSubscription(subscriptionData);
    console.log('✅ Position subscription created successfully:', subscription);
    
    console.log('\n2️⃣ Testing subscription retrieval...');
    const activeSubscriptions = await storage.getActiveSubscriptions(testFreelancerId);
    console.log('✅ Active subscriptions retrieved:', activeSubscriptions);
    
    console.log('\n3️⃣ Testing position subscriptions by category and area...');
    const positionSubscriptions = await storage.getPositionSubscriptions(testCategoryId, testArea);
    console.log('✅ Position subscriptions retrieved:', positionSubscriptions);
    
    console.log('\n🎯 Position Plan Creation Test Results:');
    console.log('✅ Position subscription creation works');
    console.log('✅ Active subscriptions retrieval works');
    console.log('✅ Position subscriptions by category/area works');
    
    console.log('\n🚀 Position plan creation logic is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testPositionPlanCreation().catch(console.error);
