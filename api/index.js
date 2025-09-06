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

// Serve static files - try multiple possible paths
const possiblePaths = [
  path.join(__dirname, '..', 'dist', 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'dist', 'public'),
  path.join(process.cwd(), 'public')
];

let staticPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log(`Found static files at: ${testPath}`);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);
} else {
  console.error('No static files found in any expected location');
  console.log('Searched paths:', possiblePaths);
}

// API routes placeholder
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}` 
  });
});

// Serve React app for all other routes
app.use('*', (req, res) => {
  if (staticPath) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
  }
  
  // Fallback response
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HireLocal</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div id="root">
        <h1>HireLocal - Freelancer Connect</h1>
        <p>Application is loading...</p>
        <p>If you see this message, the static files may not be built correctly.</p>
        <p>Health check: <a href="/health">/health</a></p>
      </div>
    </body>
    </html>
  `);
});

// Export for Vercel
module.exports = app;