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

  // Build server with esbuild
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { stdio: 'inherit' });

  // Copy server files for Vercel using Node.js fs operations
  console.log('Copying server files...');
  
  // Helper function to copy directory recursively
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  if (fs.existsSync('server')) {
    copyDir('server', 'dist/server');
    console.log('Copied server files to dist/server/');
  }
  if (fs.existsSync('shared')) {
    copyDir('shared', 'dist/shared');
    console.log('Copied shared files to dist/shared/');
  }
  
  // Ensure API directory exists for Vercel
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true });
  }
  
  // Copy the API handler if it doesn't exist
  if (!fs.existsSync('api/index.js')) {
    console.log('API handler not found, creating placeholder...');
    fs.writeFileSync('api/index.js', `const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
const staticPath = path.join(__dirname, '..', 'dist', 'public');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
}

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><head><title>HireLocal</title></head><body><h1>Loading...</h1></body></html>');
  }
});

module.exports = app;`);
  }

  console.log('Vercel build completed successfully!');
  console.log('Build output:');
  console.log('- Client files: dist/public/');
  console.log('- Server file: dist/index.js');
  console.log('- Server modules: dist/server/');
  console.log('- Shared modules: dist/shared/');
} catch (error) {
  console.error('Vercel build failed:', error.message);
  process.exit(1);
}
