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

  // Copy server files for Vercel
  console.log('Copying server files...');
  if (fs.existsSync('server')) {
    execSync('xcopy /E /I /Y server dist\\server', { stdio: 'inherit' });
  }
  if (fs.existsSync('shared')) {
    execSync('xcopy /E /I /Y shared dist\\shared', { stdio: 'inherit' });
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
