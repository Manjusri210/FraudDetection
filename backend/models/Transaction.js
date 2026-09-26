const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'],
    required: true,
  },
  accountAge: {
    type: Number, // in days
    required: true,
    default: 30,
  },
  transactionFrequency: {
    type: Number, // per month
    required: true,
    default: 5,
  },
  averageTransactionAmount: {
    type: Number,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ['Mobile', 'Desktop', 'Tablet'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'],
    required: true,
  },
  transactionTime: {
    type: Date,
    default: Date.now,
  },
  previousFraudHistory: {
    type: Number, // 0 or 1
    default: 0,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  // Prediction results from ML model
  prediction: {
    type: String,
    enum: ['LEGITIMATE', 'SUSPICIOUS', 'FRAUD'],
    required: true,
  },
  fraudProbability: {
    type: Number, // 0 - 100 percentage
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
  },
  riskFactors: [{
    type: String,
  }],
  recommendedAction: {
    type: String,
  },
  reviewed: {
    type: Boolean,
    default: false,
    index: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
