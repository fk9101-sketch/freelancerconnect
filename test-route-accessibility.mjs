#!/usr/bin/env node

/**
 * Test Route Accessibility
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5001';

async function testRouteAccessibility() {
  console.log('🔍 Testing Route Accessibility');
  console.log('=============================\n');

  // Test 1: Try to access notifications endpoint without auth
  console.log('📋 Test 1: Notifications endpoint without auth');
  try {
    const response = await fetch(`${SERVER_URL}/api/freelancer/leads/notifications`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - route not registered');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error accessing endpoint:', error.message);
  }

  // Test 2: Try to access available leads endpoint without auth
  console.log('\n📋 Test 2: Available leads endpoint without auth');
  try {
    const response = await fetch(`${SERVER_URL}/api/freelancer/leads/available`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - route not registered');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error accessing endpoint:', error.message);
  }

  // Test 3: Try to access customer leads endpoint without auth
  console.log('\n📋 Test 3: Customer leads endpoint without auth');
  try {
    const response = await fetch(`${SERVER_URL}/api/customer/leads`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - route not registered');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error accessing endpoint:', error.message);
  }

  // Test 4: Check if server is responding to basic requests
  console.log('\n📋 Test 4: Basic server response');
  try {
    const response = await fetch(`${SERVER_URL}/api/categories`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Server is responding correctly');
    } else {
      console.log(`❌ Server issue: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Server not accessible:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('===========');
  console.log('If notifications endpoint returns 404, the route is not registered');
  console.log('If it returns 401, the route exists but needs authentication');
  console.log('The issue might be in the route registration order or middleware');
}

testRouteAccessibility();
