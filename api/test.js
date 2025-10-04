// Simple test endpoint for Vercel
const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Vercel deployment working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

module.exports = app;
