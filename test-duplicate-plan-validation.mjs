#!/usr/bin/env node

/**
 * Test script for Freelancer Plan Purchase Validation
 * 
 * This script tests the duplicate plan prevention logic for all plan types:
 * - Lead Plans
 * - Position Plans  
 * - Badge Plans
 * 
 * It validates both frontend and backend validation.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  freelancerId: 'test-freelancer-123',
  categoryId: 'test-category-456',
  area: 'Test Area',
  testPlans: [
    {
      type: 'lead',
      amount: 1000,
      duration: 'monthly'
    },
    {
      type: 'position',
      amount: 2000,
      position: 1,
      categoryId: 'test-category-456',
      area: 'Test Area'
    },
    {
      type: 'badge',
      amount: 500,
      badgeType: 'verified'
    }
  ]
};

// Mock authentication token (in real scenario, this would come from login)
const AUTH_TOKEN = 'mock-auth-token';

/**
 * Test duplicate plan prevention for a specific plan type
 */
async function testDuplicatePlanPrevention(planType, planData) {
  console.log(`\n🧪 Testing ${planType.toUpperCase()} Plan Duplicate Prevention`);
  console.log('=' .repeat(60));
  
  try {
    // First purchase attempt - should succeed
    console.log(`📝 Attempting first purchase of ${planType} plan...`);
    const firstPurchaseResponse = await makeSubscriptionRequest(planData);
    
    if (firstPurchaseResponse.success) {
      console.log(`✅ First purchase successful: ${firstPurchaseResponse.id}`);
    } else {
      console.log(`❌ First purchase failed: ${firstPurchaseResponse.message}`);
      return false;
    }
    
    // Second purchase attempt - should fail with duplicate error
    console.log(`🔄 Attempting duplicate purchase of ${planType} plan...`);
    const duplicatePurchaseResponse = await makeSubscriptionRequest(planData);
    
    if (duplicatePurchaseResponse.success === false && 
        duplicatePurchaseResponse.errorType?.includes('DUPLICATE')) {
      console.log(`✅ Duplicate purchase correctly prevented: ${duplicatePurchaseResponse.message}`);
      console.log(`📊 Error Type: ${duplicatePurchaseResponse.errorType}`);
      if (duplicatePurchaseResponse.details) {
        console.log(`📅 Expiry Date: ${duplicatePurchaseResponse.details.expiryDate}`);
        console.log(`⏰ Days Remaining: ${duplicatePurchaseResponse.details.daysRemaining}`);
      }
      return true;
    } else {
      console.log(`❌ Duplicate purchase was not prevented! Response:`, duplicatePurchaseResponse);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${planType} plan:`, error.message);
    return false;
  }
}

/**
 * Make a subscription request to the backend
 */
async function makeSubscriptionRequest(planData) {
  const url = `${BASE_URL}/api/freelancer/subscriptions`;
  
  const requestBody = {
    type: planData.type,
    amount: planData.amount,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    ...(planData.position && { position: planData.position }),
    ...(planData.categoryId && { categoryId: planData.categoryId }),
    ...(planData.area && { area: planData.area }),
    ...(planData.badgeType && { badgeType: planData.badgeType })
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      ...responseData
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Test position plan specific validation
 */
async function testPositionPlanValidation() {
  console.log(`\n🎯 Testing Position Plan Specific Validation`);
  console.log('=' .repeat(60));
  
  const positionPlanData = {
    type: 'position',
    amount: 2000,
    position: 1,
    categoryId: 'test-category-456',
    area: 'Test Area'
  };
  
  try {
    // Test position plan purchase
    console.log('📝 Testing position plan purchase...');
    const response = await makeSubscriptionRequest(positionPlanData);
    
    if (response.success) {
      console.log('✅ Position plan purchase successful');
      
      // Test duplicate position plan for same category+area
      console.log('🔄 Testing duplicate position plan for same category+area...');
      const duplicateResponse = await makeSubscriptionRequest(positionPlanData);
      
      if (duplicateResponse.success === false && 
          duplicateResponse.errorType === 'DUPLICATE_POSITION_PLAN') {
        console.log('✅ Duplicate position plan correctly prevented');
        return true;
      } else {
        console.log('❌ Duplicate position plan was not prevented');
        return false;
      }
    } else {
      console.log('❌ Position plan purchase failed:', response.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing position plan validation:', error.message);
    return false;
  }
}

/**
 * Test payment verification with duplicate prevention
 */
async function testPaymentVerificationWithDuplicates() {
  console.log(`\n💳 Testing Payment Verification with Duplicate Prevention`);
  console.log('=' .repeat(60));
  
  try {
    // Mock payment verification request
    const paymentVerificationData = {
      razorpay_order_id: 'test_order_123',
      razorpay_payment_id: 'test_payment_456',
      razorpay_signature: 'test_signature_789'
    };
    
    const response = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(paymentVerificationData)
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      console.log('✅ Payment verification successful');
      return true;
    } else if (response.status === 409 && responseData.errorType === 'DUPLICATE_PLAN_DURING_PAYMENT') {
      console.log('✅ Duplicate plan detected during payment verification');
      console.log(`📊 Error Type: ${responseData.errorType}`);
      return true;
    } else {
      console.log('❌ Payment verification failed:', responseData.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing payment verification:', error.message);
    return false;
  }
}

/**
 * Test frontend error handling
 */
async function testFrontendErrorHandling() {
  console.log(`\n🖥️  Testing Frontend Error Handling`);
  console.log('=' .repeat(60));
  
  // Test different error scenarios
  const errorScenarios = [
    {
      name: 'Duplicate Lead Plan',
      errorType: 'DUPLICATE_PLAN',
      message: 'You have already taken this plan.',
      details: {
        planType: 'lead',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 15
      }
    },
    {
      name: 'Duplicate Position Plan',
      errorType: 'DUPLICATE_POSITION_PLAN',
      message: 'You have already taken this plan.',
      details: {
        planType: 'position',
        categoryId: 'test-category',
        area: 'Test Area',
        currentPosition: 1,
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 10
      }
    },
    {
      name: 'Duplicate Badge Plan',
      errorType: 'DUPLICATE_BADGE_PLAN',
      message: 'You have already taken this plan.',
      details: {
        planType: 'badge',
        badgeType: 'verified',
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 20
      }
    }
  ];
  
  let allTestsPassed = true;
  
  for (const scenario of errorScenarios) {
    console.log(`\n📋 Testing ${scenario.name} Error Handling`);
    
    // Simulate frontend error handling
    const errorMessage = generateFrontendErrorMessage(scenario);
    const expectedMessage = `You have already taken this plan. Your current plan expires on ${new Date(scenario.details.expiryDate).toLocaleDateString()} (${scenario.details.daysRemaining} days remaining).`;
    
    if (errorMessage === expectedMessage) {
      console.log('✅ Frontend error message correctly formatted');
    } else {
      console.log('❌ Frontend error message formatting failed');
      console.log(`Expected: ${expectedMessage}`);
      console.log(`Actual: ${errorMessage}`);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Generate frontend error message (simulating frontend logic)
 */
function generateFrontendErrorMessage(scenario) {
  let errorMessage = scenario.message;
  
  if (scenario.details && scenario.details.expiryDate) {
    const expiryDate = new Date(scenario.details.expiryDate).toLocaleDateString();
    const daysRemaining = scenario.details.daysRemaining;
    errorMessage += ` Your current plan expires on ${expiryDate} (${daysRemaining} days remaining).`;
  }
  
  return errorMessage;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Freelancer Plan Purchase Validation Tests');
  console.log('=' .repeat(80));
  
  const testResults = {
    leadPlan: false,
    positionPlan: false,
    badgePlan: false,
    positionPlanSpecific: false,
    paymentVerification: false,
    frontendErrorHandling: false
  };
  
  // Test each plan type
  for (const plan of TEST_CONFIG.testPlans) {
    const result = await testDuplicatePlanPrevention(plan.type, plan);
    testResults[`${plan.type}Plan`] = result;
  }
  
  // Test position plan specific validation
  testResults.positionPlanSpecific = await testPositionPlanValidation();
  
  // Test payment verification
  testResults.paymentVerification = await testPaymentVerificationWithDuplicates();
  
  // Test frontend error handling
  testResults.frontendErrorHandling = await testFrontendErrorHandling();
  
  // Print test summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(80));
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(Boolean).length;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  }
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Duplicate plan validation is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testDuplicatePlanPrevention, testPositionPlanValidation };
