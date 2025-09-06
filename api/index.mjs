import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
console.log('Setting up static file serving...');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const possiblePaths = [
  path.join(__dirname, '..', 'dist', 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'dist', 'public'),
  path.join(process.cwd(), 'public')
];

console.log('Searching for static files in paths:', possiblePaths);

let staticPath = null;
for (const testPath of possiblePaths) {
  console.log(`Checking path: ${testPath}`);
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log(`✅ Found static files at: ${testPath}`);
    break;
  } else {
    console.log(`❌ Path not found: ${testPath}`);
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
  console.log(`✅ Serving static files from: ${staticPath}`);
} else {
  console.error('❌ No static files found in any expected location');
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
  console.log(`Serving request for: ${req.method} ${req.path}`);
  
  try {
    if (staticPath) {
      const indexPath = path.join(staticPath, 'index.html');
      console.log(`Looking for index.html at: ${indexPath}`);
      
      if (fs.existsSync(indexPath)) {
        console.log('✅ Found index.html, serving React app');
        res.sendFile(indexPath);
        return;
      } else {
        console.log('❌ index.html not found at expected path');
      }
    } else {
      console.log('❌ No static path configured');
    }
    
    // Fallback response
    console.log('Serving fallback HTML response');
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
          <p>Debug info: Static path = ${staticPath || 'not found'}</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error serving request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error serving request',
      error: error.message 
    });
  }
});

// Export for Vercel (ES module syntax)
export default app;