const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve static files
const distPath = path.join(__dirname, '..', 'dist', 'public');

console.log(`Looking for static files in: ${distPath}`);

if (fs.existsSync(distPath)) {
  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
} else {
  console.error(`Build directory not found: ${distPath}`);
}

// API routes placeholder
app.use('/api/*', (req, res) => {
  console.log(`API 404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}` 
  });
});

// Serve React app for all other routes
app.use('*', (req, res) => {
  console.log(`Serving index.html for route: ${req.originalUrl}`);
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      success: false,
      message: 'Application not built properly' 
    });
  }
});

// Export for Vercel
module.exports = app;
