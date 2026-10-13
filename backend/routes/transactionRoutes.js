const express = require('express');
const router = express.Router();
const {
  analyzeTransaction,
  batchAnalyzeTransactions,
  getTransactions,
  getTransactionById,
  deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/analyze', analyzeTransaction);
router.post('/batch-analyze', batchAnalyzeTransactions);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.delete('/:id', deleteTransaction);

module.exports = router;
