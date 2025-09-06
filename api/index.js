const express = require('express');
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
    message: `API endpoint not found: ${req.method} ${req.path}`
  });
});

module.exports = app;