#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateEnvForNeon() {
  console.log('🔑 Updating .env file with Neon credentials');
  console.log('==========================================\n');
  
  console.log('From your Neon console, I can see:');
  console.log('✅ Host: ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech');
  console.log('✅ Database: neondb');
  console.log('✅ Username: neondb_owner');
  console.log('❓ Password: (click "Show password" in Neon console)\n');
  
  const neonPassword = await question('Enter your Neon password (click "Show password" in Neon console first): ');
  
  const envContent = `# Neon PostgreSQL Configuration
NEON_HOST=ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech
NEON_PORT=5432
NEON_DATABASE=neondb
NEON_USER=neondb_owner
NEON_PASSWORD=${neonPassword}

# Local PostgreSQL Configuration (for migration)
DB_HOST=localhost
DB_PORT=5000
DB_NAME=hirelocal
DB_USER=postgres
DB_PASSWORD=Jhotwara#321

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Firebase Configuration (keep your existing values)
VITE_FIREBASE_API_KEY=AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw
VITE_FIREBASE_AUTH_DOMAIN=freelancer-connect-899a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freelancer-connect-899a8
VITE_FIREBASE_STORAGE_BUCKET=freelancer-connect-899a8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=224541104230
VITE_FIREBASE_APP_ID=1:224541104230:web:62bb08bdd9ae55872a35a7
VITE_FIREBASE_MEASUREMENT_ID=G-GXMBYGFZPF

# Razorpay Configuration
VITE_RAZORPAY_LIVE_KEY_ID=your_razorpay_live_key_id
VITE_RAZORPAY_LIVE_KEY_SECRET=your_razorpay_live_key_secret
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file updated with Neon credentials');
    
    console.log('\n🚀 Ready to migrate! Next steps:');
    console.log('1. Test Neon connection: npm run neon:test');
    console.log('2. Run migration: npm run migrate:neon');
    console.log('3. Verify migration: npm run migrate:verify');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Open .env file in your editor');
    console.log('2. Update NEON_PASSWORD with your actual password');
    console.log('3. Save the file');
  }
  
  rl.close();
}

updateEnvForNeon().catch(console.error);
