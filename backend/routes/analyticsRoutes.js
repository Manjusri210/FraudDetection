const express = require('express');
const router = express.Router();
const {
  getSummary,
  getTrends,
  getRiskDistribution
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/trends', getTrends);
router.get('/risk-distribution', getRiskDistribution);

module.exports = router;
