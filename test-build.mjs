#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing build output...');

try {
  // Run build
  console.log('📦 Running build...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check build output
  const publicDir = 'dist/public';
  console.log('✅ Checking build output...');
  
  const files = fs.readdirSync(publicDir);
  console.log('📁 Files in dist/public:', files);

  // Check index.html
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    console.log('✅ index.html exists');
    console.log('📄 First 5 lines of index.html:');
    console.log(indexContent.split('\n').slice(0, 5).join('\n'));
  } else {
    console.log('❌ index.html not found');
  }

  // Check _redirects
  const redirectsPath = path.join(publicDir, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
    console.log('✅ _redirects exists');
    console.log('📄 _redirects content:');
    console.log(redirectsContent);
  } else {
    console.log('❌ _redirects not found');
  }

  // Check assets
  const assetsDir = path.join(publicDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log('✅ assets directory exists');
    console.log('📄 Assets:', assets);
  } else {
    console.log('❌ assets directory not found');
  }

  console.log('🎉 Build test completed successfully!');
  
} catch (error) {
  console.error('💥 Build test failed:', error.message);
  process.exit(1);
}
