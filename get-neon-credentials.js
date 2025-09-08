#!/usr/bin/env node

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getNeonCredentials() {
  console.log('🔑 Neon Database Credentials Setup');
  console.log('==================================\n');
  
  console.log('From your Neon console screenshot, I can see you have:');
  console.log('- Project: freelancer-connect');
  console.log('- Branch: production');
  console.log('- Database: neondb');
  console.log('- Tables: categories, freelancer_profiles, leads, users, etc.\n');
  
  console.log('To get your connection details:');
  console.log('1. In your Neon console, click on "SQL Editor" or "Connection Details"');
  console.log('2. Look for connection string or individual credentials\n');
  
  const neonHost = await question('Neon Host (e.g., ep-cool-darkness-123456.us-east-2.aws.neon.tech): ');
  const neonDatabase = await question('Neon Database name (default: neondb): ') || 'neondb';
  const neonUser = await question('Neon Username (e.g., neondb_owner): ');
  const neonPassword = await question('Neon Password: ');
  
  // Update .env file
  const fs = await import('fs');
  let envContent = `# Neon PostgreSQL Configuration
NEON_HOST=${neonHost}
NEON_PORT=5432
NEON_DATABASE=${neonDatabase}
NEON_USER=${neonUser}
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

  fs.writeFileSync('.env', envContent);
  console.log('\n✅ Environment variables updated in .env file');
  
  console.log('\n🚀 Ready to migrate! Run:');
  console.log('npm run migrate:neon');
  
  rl.close();
}

getNeonCredentials().catch(console.error);
