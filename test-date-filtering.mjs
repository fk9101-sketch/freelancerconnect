#!/usr/bin/env node

/**
 * Test script for the new date filtering functionality
 * This script tests the /api/freelancer/leads/filtered endpoint
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test data
const testCases = [
  {
    name: 'All leads (no filter)',
    url: '/api/freelancer/leads/filtered',
    expectedStatus: 200
  },
  {
    name: 'Filter by month (January 2025)',
    url: '/api/freelancer/leads/filtered?month=2025-01',
    expectedStatus: 200
  },
  {
    name: 'Filter by date range',
    url: '/api/freelancer/leads/filtered?fromDate=2025-01-01T00:00:00.000Z&toDate=2025-01-31T23:59:59.999Z',
    expectedStatus: 200
  }
];

async function testEndpoint(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📡 URL: ${BASE_URL}${testCase.url}`);
    
    const response = await fetch(`${BASE_URL}${testCase.url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication headers
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === testCase.expectedStatus) {
      console.log('✅ Status matches expected');
    } else {
      console.log(`❌ Expected status ${testCase.expectedStatus}, got ${response.status}`);
    }
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`📋 Response: ${Array.isArray(data) ? data.length : 'Not an array'} items`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`📅 Sample lead created: ${data[0].createdAt}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting date filtering API tests...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  for (const testCase of testCases) {
    await testEndpoint(testCase);
  }
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Note: These tests require the server to be running and proper authentication.');
  console.log('   For full testing, use the web interface with a logged-in freelancer account.');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testEndpoint };
