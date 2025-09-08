#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create .env file for Neon configuration
const envContent = `# Neon PostgreSQL Configuration
NEON_HOST=your_neon_host_here
NEON_PORT=5432
NEON_DATABASE=your_neon_database_here
NEON_USER=your_neon_user_here
NEON_PASSWORD=your_neon_password_here

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

// Create .env file
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);
console.log('✅ Created .env file with Neon configuration template');

// Create .env.neon file for Neon-specific configuration
const neonEnvContent = `# Neon PostgreSQL Configuration
# Replace these values with your actual Neon database credentials

# Get these from your Neon dashboard: https://console.neon.tech/
NEON_HOST=your_neon_host_here
NEON_PORT=5432
NEON_DATABASE=your_neon_database_here
NEON_USER=your_neon_user_here
NEON_PASSWORD=your_neon_password_here

# Example:
# NEON_HOST=ep-cool-darkness-123456.us-east-2.aws.neon.tech
# NEON_DATABASE=neondb
# NEON_USER=neondb_owner
# NEON_PASSWORD=your_actual_password_here
`;

const neonEnvPath = path.join(__dirname, '.env.neon');
fs.writeFileSync(neonEnvPath, neonEnvContent);
console.log('✅ Created .env.neon file with Neon configuration template');

// Update drizzle.config.ts for Neon
const drizzleConfigContent = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.NEON_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.NEON_PORT || process.env.DB_PORT || '5432'),
    database: process.env.NEON_DATABASE || process.env.DB_NAME || 'hirelocal',
    user: process.env.NEON_USER || process.env.DB_USER || 'postgres',
    password: process.env.NEON_PASSWORD || process.env.DB_PASSWORD || 'Jhotwara#321',
    ssl: process.env.NEON_HOST ? { rejectUnauthorized: false } : false,
  },
});
`;

const drizzleConfigPath = path.join(__dirname, 'drizzle.config.ts');
fs.writeFileSync(drizzleConfigPath, drizzleConfigContent);
console.log('✅ Updated drizzle.config.ts for Neon support');

console.log('\n📋 Next steps:');
console.log('1. Get your Neon database credentials from https://console.neon.tech/');
console.log('2. Update the .env file with your actual Neon credentials');
console.log('3. Run: node migrate-to-neon.js');
console.log('4. Test the migration with: npm run db:test');
