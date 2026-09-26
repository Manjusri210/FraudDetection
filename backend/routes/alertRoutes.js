const express = require('express');
const router = express.Router();
const { getAlerts, updateAlertReview } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAlerts);
router.patch('/:id/review', updateAlertReview);

module.exports = router;
