#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function quickMigrate() {
  console.log('🚀 HireLocal Neon Migration Quick Start');
  console.log('=====================================\n');
  
  try {
    // Step 1: Check if .env exists
    if (!fs.existsSync('.env')) {
      console.log('📝 Setting up environment configuration...');
      execSync('node setup-neon-env.js', { stdio: 'inherit' });
      console.log('✅ Environment files created\n');
    } else {
      console.log('✅ Environment files already exist\n');
    }
    
    // Step 2: Get Neon credentials
    console.log('🔑 Please provide your Neon database credentials:');
    console.log('   (Get these from https://console.neon.tech/)\n');
    
    const neonHost = await question('Neon Host (e.g., ep-cool-darkness-123456.us-east-2.aws.neon.tech): ');
    const neonDatabase = await question('Neon Database name (e.g., neondb): ');
    const neonUser = await question('Neon Username (e.g., neondb_owner): ');
    const neonPassword = await question('Neon Password: ');
    
    // Update .env file
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace('your_neon_host_here', neonHost);
    envContent = envContent.replace('your_neon_database_here', neonDatabase);
    envContent = envContent.replace('your_neon_user_here', neonUser);
    envContent = envContent.replace('your_neon_password_here', neonPassword);
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Environment variables updated\n');
    
    // Step 3: Ask about backup
    const createBackup = await question('📦 Create backup of current data? (y/n): ');
    if (createBackup.toLowerCase() === 'y') {
      console.log('\n🔄 Creating backup...');
      execSync('node export-local-data.js', { stdio: 'inherit' });
      console.log('✅ Backup created\n');
    }
    
    // Step 4: Run migration
    console.log('🔄 Starting migration to Neon...');
    execSync('node migrate-to-neon.js', { stdio: 'inherit' });
    console.log('✅ Migration completed\n');
    
    // Step 5: Verify migration
    console.log('🔍 Verifying migration...');
    execSync('node verify-neon-migration.js', { stdio: 'inherit' });
    console.log('✅ Verification completed\n');
    
    // Step 6: Summary
    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test your application with the new database');
    console.log('2. Update your production environment variables');
    console.log('3. Deploy your application');
    console.log('4. Monitor the application for any issues');
    
    console.log('\n📁 Files created:');
    console.log('- .env (updated with Neon credentials)');
    console.log('- backups/ (contains backup data)');
    console.log('- NEON_MIGRATION_GUIDE.md (detailed guide)');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Neon credentials');
    console.log('2. Ensure your local database is running');
    console.log('3. Check your internet connection');
    console.log('4. Review the error logs above');
  } finally {
    rl.close();
  }
}

// Run quick migrate if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickMigrate().catch(console.error);
}

export { quickMigrate };
