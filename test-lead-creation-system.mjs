import { spawn } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testLeadCreation() {
  console.log('🧪 Testing Lead Creation System');
  console.log('===============================');

  // Start the server
  console.log('🚀 Starting server...');
  const server = spawn('npx', ['tsx', 'index.ts'], {
    cwd: './server',
    stdio: 'pipe'
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Test server connectivity
    console.log('📡 Testing server connectivity...');
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    if (categoriesResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server not responding');
      return;
    }

    // Test lead creation
    console.log('📝 Testing lead creation...');
    const testResponse = await fetch(`${BASE_URL}/api/test/create-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ Test lead created successfully!');
      console.log('📊 Results:', result);
      
      if (result.freelancersNotified > 0) {
        console.log('🎉 Lead delivery system is working!');
        console.log(`   ${result.freelancersNotified} freelancers were notified`);
      } else {
        console.log('⚠️ No freelancers were notified');
        console.log('   This could indicate a matching issue');
      }
    } else {
      console.log(`❌ Test lead creation failed: ${testResponse.status}`);
      const error = await testResponse.text();
      console.log('Error details:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Stop the server
    console.log('🛑 Stopping server...');
    server.kill();
  }
}

testLeadCreation();

