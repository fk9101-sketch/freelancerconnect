// Simple Node.js API handler for Vercel
// Using standard exports to avoid ES module issues

const express = require('express');
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
    message: 'Server is running - CommonJS Fixed - Cache Cleared',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    moduleType: 'CommonJS',
    version: '4.0.0',
    handler: 'api/index.js',
    status: 'FINAL_FIX_APPLIED'
  });
});

// API routes placeholder
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}` 
  });
});

// Export for Vercel
module.exports = app;
