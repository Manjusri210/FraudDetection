const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// @route   GET /api/model/metrics
// @desc    Proxy model evaluation metrics from Flask ML service
router.get('/metrics', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/metrics`, { timeout: 5000 });
    return res.json(response.data);
  } catch (err) {
    // Return cached/default metrics if ML service is down
    return res.status(503).json({
      message: 'ML service unavailable — metrics could not be retrieved',
      error: err.message
    });
  }
});

// @route   GET /api/model/status
// @desc    Check ML service readiness and model version
router.get('/status', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return res.json({
      ml_service: 'HEALTHY',
      model_loaded: response.data.model_loaded,
      model_version: response.data.model_version,
      shap_available: response.data.shap_available,
    });
  } catch {
    return res.json({
      ml_service: 'UNAVAILABLE',
      model_loaded: false,
      model_version: null,
      shap_available: false,
    });
  }
});

module.exports = router;
