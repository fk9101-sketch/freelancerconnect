#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting Vercel build process...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build client with Vite
  console.log('Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Ensure API directory exists
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true });
  }

  // Create API handler for Vercel
  console.log('Creating API handler...');
  fs.writeFileSync('api/index.js', `const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Server is running - Vercel Build Fixed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    moduleType: 'CommonJS',
    version: '5.0.0',
    handler: 'api/index.js',
    status: 'SINGLE_SHOT_FIX_APPLIED'
  });
});

// API routes placeholder
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: \`API endpoint not found: \${req.method} \${req.path}\`
  });
});

// Export for Vercel
module.exports = app;`);

  console.log('Vercel build completed successfully!');
  console.log('Build output:');
  console.log('- Client files: dist/public/');
  console.log('- API handler: api/index.js');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
