import fs from 'fs';

console.log('🔍 DIAGNOSING LEAD DELIVERY ISSUES');
console.log('=' .repeat(60));

// Check if there are any leads in the database
console.log('\n📋 Step 1: Checking Database for Leads');
const schemaPath = 'shared/schema.ts';
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Schema file exists');
  
  if (content.includes('leads')) {
    console.log('✅ Leads table defined in schema');
  } else {
    console.log('❌ Leads table not found in schema');
  }
} else {
  console.log('❌ Schema file not found');
}

// Check the getFreelancersByCategory function implementation
console.log('\n📋 Step 2: Checking Freelancer Matching Logic');
const storagePath = 'server/storage.ts';
if (fs.existsSync(storagePath)) {
  const content = fs.readFileSync(storagePath, 'utf8');
  
  // Look for the getFreelancersByCategory function
  const functionMatch = content.match(/async getFreelancersByCategory\([^)]+\)[^{]*{([^}]*(?:{[^}]*}[^}]*)*)}/s);
  if (functionMatch) {
    console.log('✅ getFreelancersByCategory function found');
    const functionBody = functionMatch[1];
    
    if (functionBody.includes('eq(freelancerProfiles.categoryId, categoryId)')) {
      console.log('✅ Category filtering implemented');
    } else {
      console.log('❌ Category filtering missing');
    }
    
    if (functionBody.includes('LOWER(${freelancerProfiles.area}) = LOWER(${area})')) {
      console.log('✅ Area filtering implemented');
    } else {
      console.log('❌ Area filtering missing');
    }
    
    if (functionBody.includes('eq(freelancerProfiles.verificationStatus, \'approved\')')) {
      console.log('✅ Verification status filtering implemented');
    } else {
      console.log('❌ Verification status filtering missing');
    }
    
    if (functionBody.includes('eq(freelancerProfiles.isAvailable, true)')) {
      console.log('✅ Availability filtering implemented');
    } else {
      console.log('❌ Availability filtering missing');
    }
  } else {
    console.log('❌ getFreelancersByCategory function not found');
  }
} else {
  console.log('❌ Storage file not found');
}

// Check the lead creation endpoint
console.log('\n📋 Step 3: Checking Lead Creation Endpoint');
const routesPath = 'server/routes.ts';
if (fs.existsSync(routesPath)) {
  const content = fs.readFileSync(routesPath, 'utf8');
  
  if (content.includes('app.post(\'/api/customer/leads\'')) {
    console.log('✅ Lead creation endpoint exists');
  } else {
    console.log('❌ Lead creation endpoint missing');
  }
  
  if (content.includes('getFreelancersByCategory(leadData.categoryId, leadData.location)')) {
    console.log('✅ Freelancer matching called in lead creation');
  } else {
    console.log('❌ Freelancer matching not called in lead creation');
  }
  
  if (content.includes('notifyUser(freelancer.userId, {')) {
    console.log('✅ Notification sending implemented');
  } else {
    console.log('❌ Notification sending missing');
  }
} else {
  console.log('❌ Routes file not found');
}

// Check the notifications endpoint
console.log('\n📋 Step 4: Checking Notifications Endpoint');
if (fs.existsSync(routesPath)) {
  const content = fs.readFileSync(routesPath, 'utf8');
  
  if (content.includes('app.get(\'/api/freelancer/leads/notifications\'')) {
    console.log('✅ Notifications endpoint exists');
  } else {
    console.log('❌ Notifications endpoint missing');
  }
  
  if (content.includes('eq(leads.categoryId, profile.categoryId)')) {
    console.log('✅ Category filtering in notifications endpoint');
  } else {
    console.log('❌ Category filtering missing in notifications endpoint');
  }
  
  if (content.includes('LOWER(${leads.location}) = LOWER(${profile.area})')) {
    console.log('✅ Area filtering in notifications endpoint');
  } else {
    console.log('❌ Area filtering missing in notifications endpoint');
  }
} else {
  console.log('❌ Routes file not found');
}

// Check frontend dashboard implementation
console.log('\n📋 Step 5: Checking Frontend Dashboard');
const dashboardPath = 'client/src/pages/freelancer-dashboard.tsx';
if (fs.existsSync(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  if (content.includes('/api/freelancer/leads/notifications')) {
    console.log('✅ Dashboard uses notifications endpoint');
  } else {
    console.log('❌ Dashboard does not use notifications endpoint');
  }
  
  if (content.includes('useQuery')) {
    console.log('✅ Dashboard uses React Query for data fetching');
  } else {
    console.log('❌ Dashboard does not use React Query');
  }
  
  if (content.includes('availableLeads')) {
    console.log('✅ Dashboard displays available leads');
  } else {
    console.log('❌ Dashboard does not display available leads');
  }
} else {
  console.log('❌ Dashboard file not found');
}

console.log('\n🎯 POTENTIAL ISSUES TO CHECK:');
console.log('=' .repeat(60));
console.log('1. Are there any leads in the database?');
console.log('2. Are freelancer profiles created with correct categoryId and area?');
console.log('3. Are freelancer profiles marked as verified and available?');
console.log('4. Are customers posting leads with correct categoryId and location?');
console.log('5. Is the WebSocket connection working for real-time notifications?');
console.log('6. Is the polling mechanism working for notifications?');
console.log('7. Are there any console errors in the browser?');
console.log('8. Are there any server errors in the logs?');

console.log('\n🔧 NEXT STEPS:');
console.log('1. Check browser console for errors');
console.log('2. Check server logs for errors');
console.log('3. Verify freelancer profiles have correct data');
console.log('4. Test lead creation manually');
console.log('5. Check if notifications endpoint returns data');
