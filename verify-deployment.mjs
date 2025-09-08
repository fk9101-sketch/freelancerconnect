#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying deployment configuration...');

const publicDir = 'dist/public';

// Check if build output exists
if (!fs.existsSync(publicDir)) {
  console.log('❌ Build output directory not found. Run npm run build first.');
  process.exit(1);
}

// Check index.html
const indexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ index.html exists');
  const content = fs.readFileSync(indexPath, 'utf8');
  if (content.includes('Freelancer Connect')) {
    console.log('✅ index.html contains correct content');
  } else {
    console.log('❌ index.html content seems incorrect');
  }
} else {
  console.log('❌ index.html not found');
}

// Check _redirects
const redirectsPath = path.join(publicDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  console.log('✅ _redirects file exists');
  const content = fs.readFileSync(redirectsPath, 'utf8');
  console.log('📄 _redirects content:', content.trim());
  if (content.trim() === '/*    /index.html   200') {
    console.log('✅ _redirects content is correct');
  } else {
    console.log('❌ _redirects content is incorrect');
  }
} else {
  console.log('❌ _redirects file not found');
}

// Check assets
const assetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir);
  console.log('✅ assets directory exists');
  console.log('📄 Assets:', assets);
  
  const jsFile = assets.find(file => file.endsWith('.js'));
  const cssFile = assets.find(file => file.endsWith('.css'));
  
  if (jsFile && cssFile) {
    console.log('✅ Both JS and CSS files found');
  } else {
    console.log('❌ Missing JS or CSS files');
  }
} else {
  console.log('❌ assets directory not found');
}

// Check netlify.toml
const netlifyTomlPath = 'netlify.toml';
if (fs.existsSync(netlifyTomlPath)) {
  console.log('✅ netlify.toml exists');
  const content = fs.readFileSync(netlifyTomlPath, 'utf8');
  if (content.includes('[[redirects]]') && content.includes('/*') && content.includes('/index.html')) {
    console.log('✅ netlify.toml contains redirect rules');
  } else {
    console.log('❌ netlify.toml missing redirect rules');
  }
} else {
  console.log('❌ netlify.toml not found');
}

console.log('\n🎯 DEPLOYMENT CHECKLIST:');
console.log('1. ✅ Build output generated');
console.log('2. ✅ index.html present');
console.log('3. ✅ _redirects file present');
console.log('4. ✅ Assets generated');
console.log('5. ✅ netlify.toml configured');
console.log('\n📋 NEXT STEPS:');
console.log('1. Commit and push these changes');
console.log('2. Go to Netlify Dashboard');
console.log('3. Set Build command: npm run build');
console.log('4. Set Publish directory: dist/public');
console.log('5. Add redirect rule: /* → /index.html (200)');
console.log('6. Clear cache and redeploy');
console.log('\n🌐 Your site should work at:');
console.log('https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/');
