#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting SINGLE SHOT Vercel build...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build client with Vite
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Verify build output
  console.log('Verifying build output...');
  const publicDir = 'dist/public';
  if (!fs.existsSync(publicDir)) {
    throw new Error('Build output directory not found');
  }

  const indexHtml = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error('index.html not found in build output');
  }

  // Check for assets
  const assetsDir = path.join(publicDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log('Assets found:', assets);
  }

  // Ensure API directory exists
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true });
  }

  // Create simple API handler
  console.log('Creating API handler...');
  fs.writeFileSync('api/index.js', `const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'SINGLE SHOT FIX - Server running',
    timestamp: new Date().toISOString(),
    version: '6.0.0',
    status: 'FINAL_OVERHAUL_COMPLETE'
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: \`API endpoint not found: \${req.method} \${req.path}\`
  });
});

module.exports = app;`);

  console.log('✅ SINGLE SHOT BUILD COMPLETED SUCCESSFULLY!');
  console.log('📁 Build output: dist/public/');
  console.log('🔧 API handler: api/index.js');
  console.log('🚀 Ready for Vercel deployment!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
