#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Post-build: Adding Netlify configuration files...');

const distDir = 'dist';

try {
  // Create _redirects file for SPA routing
  const redirectsContent = `/*    /index.html   200`;
  fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);
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
  
  fs.writeFileSync(path.join(distDir, '_headers'), headersContent);
  console.log('✅ Created _headers file for caching');

  console.log('🎉 Post-build completed successfully!');
} catch (error) {
  console.error('💥 Post-build failed:', error.message);
  process.exit(1);
}
