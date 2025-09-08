#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Netlify build process...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build client with Vite
  console.log('📦 Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Verify build output
  console.log('✅ Verifying build output...');
  const publicDir = 'dist/public';
  if (!fs.existsSync(publicDir)) {
    throw new Error('❌ Build output directory not found');
  }

  const indexHtml = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error('❌ index.html not found');
  }

  // Check for assets
  const assetsDir = path.join(publicDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log('📄 Assets found:', assets);
    
    // Verify JS file exists
    const jsFile = assets.find(file => file.endsWith('.js'));
    if (!jsFile) {
      throw new Error('❌ JavaScript file not found');
    }
    console.log('✅ JavaScript file:', jsFile);
    
    // Verify CSS file exists
    const cssFile = assets.find(file => file.endsWith('.css'));
    if (!cssFile) {
      throw new Error('❌ CSS file not found');
    }
    console.log('✅ CSS file:', cssFile);
  } else {
    throw new Error('❌ Assets directory not found');
  }

  // Create a simple _redirects file for Netlify SPA routing (backup)
  const redirectsContent = `/*    /index.html   200`;
  fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);
  console.log('✅ Created _redirects file for SPA routing (backup)');

  console.log('🎉 Netlify build completed successfully!');
  console.log('📁 Static files: dist/public/');
  console.log('🌐 Ready for Netlify deployment!');
} catch (error) {
  console.error('💥 Netlify build failed:', error.message);
  process.exit(1);
}
