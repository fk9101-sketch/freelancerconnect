#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 ULTRA SIMPLE STATIC BUILD...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build client with Vite
  console.log('📦 Building with Vite...');
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

  // Create _redirects file for SPA routing - Netlify format
  const redirectsContent = `/*    /index.html   200`;
  fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);
  console.log('✅ Created _redirects file for SPA routing');

  // Create _headers file for better caching
  const headersContent = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable`;
  
  fs.writeFileSync(path.join(publicDir, '_headers'), headersContent);
  console.log('✅ Created _headers file for caching');

  console.log('🎉 ULTRA SIMPLE BUILD COMPLETED!');
  console.log('📁 Static files: dist/public/');
  console.log('🌐 Ready for static deployment!');
} catch (error) {
  console.error('💥 Build failed:', error.message);
  process.exit(1);
}
