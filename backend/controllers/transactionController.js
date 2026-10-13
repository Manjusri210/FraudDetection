const Transaction = require('../models/Transaction');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// @route   POST /api/transactions/analyze
exports.analyzeTransaction = async (req, res) => {
  try {
    const {
      amount, transactionType, accountAge, transactionFrequency,
      averageTransactionAmount, deviceType, location, ipAddress,
      paymentMethod, previousFraudHistory, failedAttempts, customTransactionId
    } = req.body;

    if (!amount || !transactionType || !paymentMethod || !deviceType || !location) {
      return res.status(400).json({ message: 'Missing required transaction fields' });
    }

    const txId = customTransactionId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const mlPayload = {
      amount: parseFloat(amount),
      transactionType,
      accountAge: parseFloat(accountAge || 30),
      transactionFrequency: parseFloat(transactionFrequency || 1),
      averageTransactionAmount: parseFloat(averageTransactionAmount || amount),
      deviceType,
      location,
      ipAddress: ipAddress || '127.0.0.1',
      paymentMethod,
      previousFraudHistory: parseInt(previousFraudHistory || 0, 10),
      failedAttempts: parseInt(failedAttempts || 0, 10)
    };

    let mlResponse;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, mlPayload, { timeout: 10000 });
      mlResponse = response.data;
    } catch (mlErr) {
      console.warn(`ML Service unavailable (${mlErr.message}). Rule-based fallback active.`);
      const ratio = mlPayload.amount / (mlPayload.averageTransactionAmount + 1e-5);
      let prob = 15;
      if (ratio > 3.0) prob += 40;
      if (mlPayload.failedAttempts >= 3) prob += 35;
      if (mlPayload.previousFraudHistory === 1) prob += 25;
      prob = Math.min(prob, 98);
      const riskLevel = prob >= 65 ? 'HIGH' : prob >= 35 ? 'MEDIUM' : 'LOW';
      mlResponse = {
        prediction: prob >= 65 ? 'FRAUD' : prob >= 35 ? 'SUSPICIOUS' : 'LEGITIMATE',
        fraud_probability: prob,
        risk_level: riskLevel,
        risk_factors: [
          ratio > 3.0 ? `Unusual amount ratio (${ratio.toFixed(1)}x higher than average)` : null,
          mlPayload.failedAttempts >= 3 ? `${mlPayload.failedAttempts} failed authentication attempts` : null,
          mlPayload.previousFraudHistory === 1 ? 'Previous fraud record on account' : null
        ].filter(Boolean),
        recommended_action: riskLevel === 'HIGH'
          ? 'Block transaction immediately and notify account holder'
          : riskLevel === 'MEDIUM'
          ? 'Request secondary verification (OTP / identity check)'
          : 'Approve — transaction within normal parameters'
      };
    }

    const newTx = await Transaction.create({
      transactionId: txId,
      userId: req.user._id,
      amount: mlPayload.amount,
      transactionType: mlPayload.transactionType,
      accountAge: mlPayload.accountAge,
      transactionFrequency: mlPayload.transactionFrequency,
      averageTransactionAmount: mlPayload.averageTransactionAmount,
      deviceType: mlPayload.deviceType,
      location: mlPayload.location,
      ipAddress: mlPayload.ipAddress,
      paymentMethod: mlPayload.paymentMethod,
      previousFraudHistory: mlPayload.previousFraudHistory,
      failedAttempts: mlPayload.failedAttempts,
      prediction: mlResponse.prediction,
      fraudProbability: mlResponse.fraud_probability,
      riskLevel: mlResponse.risk_level,
      riskFactors: mlResponse.risk_factors || [],
      recommendedAction: mlResponse.recommended_action || 'Review transaction details',
      reviewed: false,
    });

    res.status(201).json({
      message: 'Transaction analyzed successfully',
      transaction: newTx,
      result: mlResponse
    });
  } catch (error) {
    console.error('Error analyzing transaction:', error);
    res.status(500).json({ message: error.message || 'Server error analyzing transaction' });
  }
};

// @route   POST /api/transactions/batch-analyze
exports.batchAnalyzeTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ message: "'transactions' must be an array" });
    }
    if (transactions.length === 0) {
      return res.status(400).json({ message: 'No transactions provided' });
    }
    if (transactions.length > 500) {
      return res.status(400).json({ message: 'Batch size limit is 500 transactions per request' });
    }

    let mlBatchResponse;
    try {
      const response = await axios.post(
        `${ML_SERVICE_URL}/predict/batch`,
        { transactions },
        { timeout: 60000 }
      );
      mlBatchResponse = response.data;
    } catch (mlErr) {
      return res.status(503).json({
        message: `ML Service unavailable: ${mlErr.message}. Ensure Flask service is running on port 5001.`
      });
    }

    const savedResults = [];
    const batchResults = mlBatchResponse.results || [];

    for (let i = 0; i < batchResults.length; i++) {
      const item = batchResults[i];
      const inputTx = transactions[i];

      if (item.error || !item.result) {
        savedResults.push({ index: i, result: null, error: item.error || 'Prediction failed' });
        continue;
      }

      try {
        const ml = item.result;
        const txId = `TXN-BATCH-${Date.now()}-${i}`;
        await Transaction.create({
          transactionId: txId,
          userId: req.user._id,
          amount: parseFloat(inputTx.amount),
          transactionType: inputTx.transactionType,
          accountAge: parseFloat(inputTx.accountAge || 30),
          transactionFrequency: parseFloat(inputTx.transactionFrequency || 1),
          averageTransactionAmount: parseFloat(inputTx.averageTransactionAmount || inputTx.amount),
          deviceType: inputTx.deviceType,
          location: inputTx.location,
          ipAddress: inputTx.ipAddress || '127.0.0.1',
          paymentMethod: inputTx.paymentMethod,
          previousFraudHistory: parseInt(inputTx.previousFraudHistory || 0, 10),
          failedAttempts: parseInt(inputTx.failedAttempts || 0, 10),
          prediction: ml.prediction,
          fraudProbability: ml.fraud_probability,
          riskLevel: ml.risk_level,
          riskFactors: ml.risk_factors || [],
          recommendedAction: ml.recommended_action || 'Review',
          reviewed: false,
        });
        savedResults.push({ index: i, result: ml, error: null });
      } catch (dbErr) {
        savedResults.push({ index: i, result: item.result, error: `DB save failed: ${dbErr.message}` });
      }
    }

    const successful = savedResults.filter(r => !r.error).length;
    const failed = savedResults.filter(r => r.error).length;
    const fraud = savedResults.filter(r => r.result?.risk_level === 'HIGH').length;
    const suspicious = savedResults.filter(r => r.result?.risk_level === 'MEDIUM').length;

    res.status(200).json({
      message: `Batch complete: ${successful} analyzed, ${failed} failed`,
      total: transactions.length,
      successful,
      failed,
      fraud,
      suspicious,
      legitimate: successful - fraud - suspicious,
      results: savedResults
    });
  } catch (error) {
    console.error('Batch analyze error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { search, prediction, riskLevel, transactionType, sortBy, order, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } }
      ];
    }
    if (prediction) query.prediction = prediction.toUpperCase();
    if (riskLevel) query.riskLevel = riskLevel.toUpperCase();
    if (transactionType) query.transactionType = transactionType;

    const sortOption = {};
    if (sortBy) {
      sortOption[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOption.createdAt = -1;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query).sort(sortOption).skip(skip).limit(limitNum);

    res.json({ transactions, page: pageNum, pages: Math.ceil(total / limitNum), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
