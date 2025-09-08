import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// Proxy API calls to the production server
app.use('/api', createProxyMiddleware({
  target: 'https://mythefreelance.netlify.app',
  changeOrigin: true,
  logLevel: 'info',
  secure: true,
  pathRewrite: {
    '^/api': '/api' // Keep the /api prefix
  }
}));

// Serve the main React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📡 API calls will be proxied to https://mythefreelance.netlify.app`);
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
});
