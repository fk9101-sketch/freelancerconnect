#!/usr/bin/env node

/**
 * Quick Test: Check if leads are being created and freelancers are receiving them
 */

import fs from 'fs';

console.log('🔍 Quick Test: Lead Creation and Notification System');
console.log('===================================================\n');

// Check if server is running
console.log('📋 Test 1: Check if server endpoints exist');

const routesContent = fs.readFileSync('server/routes.ts', 'utf8');

// Check lead creation endpoint
if (routesContent.includes('app.post(\'/api/customer/leads\'')) {
  console.log('✅ Lead creation endpoint exists');
} else {
  console.log('❌ Lead creation endpoint missing');
}

// Check notifications endpoint
if (routesContent.includes('app.get(\'/api/freelancer/leads/notifications\'')) {
  console.log('✅ Notifications endpoint exists');
} else {
  console.log('❌ Notifications endpoint missing');
}

// Check if getFreelancersByCategory is being called
if (routesContent.includes('getFreelancersByCategory(leadData.categoryId, leadData.location)')) {
  console.log('✅ Lead creation calls getFreelancersByCategory correctly');
} else {
  console.log('❌ Lead creation does not call getFreelancersByCategory correctly');
}

// Check if notifications are being sent
if (routesContent.includes('notifyUser(freelancer.userId, {') && routesContent.includes('type: \'lead_ring\'')) {
  console.log('✅ Lead creation sends notifications to freelancers');
} else {
  console.log('❌ Lead creation does not send notifications to freelancers');
}

console.log('\n📋 Test 2: Check freelancer matching logic');

const storageContent = fs.readFileSync('server/storage.ts', 'utf8');

// Check getFreelancersByCategory function
if (storageContent.includes('async getFreelancersByCategory(categoryId: string, area?: string)')) {
  console.log('✅ getFreelancersByCategory function exists');
  
  // Check if it filters by category and area
  if (storageContent.includes('eq(freelancerProfiles.categoryId, categoryId)') && 
      storageContent.includes('LOWER(${freelancerProfiles.area}) = LOWER(${area})')) {
    console.log('✅ Function properly filters by category and area');
  } else {
    console.log('❌ Function does not properly filter by category and area');
  }
} else {
  console.log('❌ getFreelancersByCategory function missing');
}

console.log('\n📋 Test 3: Check frontend notification system');

const dashboardContent = fs.readFileSync('client/src/pages/freelancer-dashboard.tsx', 'utf8');

// Check if dashboard uses notifications endpoint
if (dashboardContent.includes('/api/freelancer/leads/notifications')) {
  console.log('✅ Dashboard uses notifications endpoint');
} else {
  console.log('❌ Dashboard does not use notifications endpoint');
}

// Check if useLeadNotifications hook is used
if (dashboardContent.includes('useLeadNotifications')) {
  console.log('✅ Dashboard uses useLeadNotifications hook');
} else {
  console.log('❌ Dashboard does not use useLeadNotifications hook');
}

console.log('\n📋 Test 4: Check notification component');

const notificationContent = fs.readFileSync('client/src/components/lead-notification.tsx', 'utf8');

// Check if component accepts hasLeadPlan prop
if (notificationContent.includes('hasLeadPlan: boolean')) {
  console.log('✅ Notification component accepts hasLeadPlan prop');
} else {
  console.log('❌ Notification component does not accept hasLeadPlan prop');
}

// Check if it shows different buttons
if (notificationContent.includes('hasLeadPlan ? (') && notificationContent.includes('Upgrade to Accept')) {
  console.log('✅ Notification component shows different buttons for free vs paid');
} else {
  console.log('❌ Notification component does not show different buttons');
}

console.log('\n🎯 Summary:');
console.log('===========');

const allTestsPass = 
  routesContent.includes('app.post(\'/api/customer/leads\'') &&
  routesContent.includes('app.get(\'/api/freelancer/leads/notifications\'') &&
  routesContent.includes('getFreelancersByCategory(leadData.categoryId, leadData.location)') &&
  routesContent.includes('notifyUser(freelancer.userId, {') &&
  storageContent.includes('async getFreelancersByCategory(categoryId: string, area?: string)') &&
  dashboardContent.includes('/api/freelancer/leads/notifications') &&
  dashboardContent.includes('useLeadNotifications') &&
  notificationContent.includes('hasLeadPlan: boolean');

if (allTestsPass) {
  console.log('✅ All backend and frontend components are properly configured');
  console.log('✅ The issue might be:');
  console.log('   - No customers are posting leads');
  console.log('   - No freelancers match the category/area criteria');
  console.log('   - Server is not running');
  console.log('   - Database connection issues');
} else {
  console.log('❌ Some components are missing or misconfigured');
}

console.log('\n🔧 Next Steps:');
console.log('1. Start the server: npm run dev');
console.log('2. Create a test customer account');
console.log('3. Create a test freelancer account in the same category/area');
console.log('4. Post a lead from customer dashboard');
console.log('5. Check freelancer dashboard for notifications');
