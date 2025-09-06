#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting build process...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build client with Vite
  console.log('Building client...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Build server with esbuild
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { stdio: 'inherit' });

  // Copy server files to api directory for Vercel
  console.log('Copying server files to api directory...');
  execSync('xcopy /E /I /Y server dist\\server', { stdio: 'inherit' });
  execSync('xcopy /E /I /Y shared dist\\shared', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
