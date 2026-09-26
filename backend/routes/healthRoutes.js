const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  
  let mlServiceState = 'UNKNOWN';
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';
    const mlRes = await axios.get(`${mlUrl}/health`, { timeout: 3000 });
    mlServiceState = mlRes.data.status || 'CONNECTED';
  } catch (err) {
    mlServiceState = 'UNAVAILABLE';
  }

  res.json({
    status: 'ONLINE',
    service: 'Digital Fraud Detection Backend API',
    timestamp: new Date(),
    database: dbState,
    mlService: mlServiceState
  });
});

module.exports = router;
