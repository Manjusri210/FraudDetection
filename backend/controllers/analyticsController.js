const Transaction = require('../models/Transaction');

// Helper to compute date filter threshold
const getDateThreshold = (range) => {
  const now = new Date();
  if (range === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  } else if (range === '7days') {
    return new Date(now.setDate(now.getDate() - 7));
  } else if (range === '30days') {
    return new Date(now.setDate(now.getDate() - 30));
  } else if (range === '3months') {
    return new Date(now.setMonth(now.getMonth() - 3));
  }
  return null; // default all time
};

// @route   GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const matchQuery = { userId: req.user._id };

    const threshold = getDateThreshold(range);
    if (threshold) {
      matchQuery.createdAt = { $gte: threshold };
    } else if (startDate && endDate) {
      matchQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const totalTransactions = await Transaction.countDocuments(matchQuery);
    const fraudulentCount = await Transaction.countDocuments({ ...matchQuery, riskLevel: 'HIGH' });
    const suspiciousCount = await Transaction.countDocuments({ ...matchQuery, riskLevel: 'MEDIUM' });
    const legitimateCount = await Transaction.countDocuments({ ...matchQuery, riskLevel: 'LOW' });

    const avgAmountResult = await Transaction.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, avgAmount: { $avg: '$amount' }, totalAmount: { $sum: '$amount' } } }
    ]);

    const avgAmount = avgAmountResult.length > 0 ? avgAmountResult[0].avgAmount : 0;
    const totalVolume = avgAmountResult.length > 0 ? avgAmountResult[0].totalAmount : 0;
    const fraudRate = totalTransactions > 0 ? ((fraudulentCount + suspiciousCount) / totalTransactions) * 100 : 0;

    res.json({
      totalTransactions,
      fraudulentCount,
      suspiciousCount,
      legitimateCount,
      highRiskCount: fraudulentCount,
      avgAmount: Math.round(avgAmount * 100) / 100,
      totalVolume: Math.round(totalVolume * 100) / 100,
      fraudRate: Math.round(fraudRate * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/analytics/trends
exports.getTrends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Group transactions by date for the last 14 entries or days
    const trends = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          fraudulent: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } },
          suspicious: { $sum: { $cond: [{ $eq: ['$riskLevel', 'MEDIUM'] }, 1, 0] } },
          legitimate: { $sum: { $cond: [{ $eq: ['$riskLevel', 'LOW'] }, 1, 0] } },
          volume: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/analytics/risk-distribution
exports.getRiskDistribution = async (req, res) => {
  try {
    const userId = req.user._id;

    const riskDistribution = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    const byPaymentMethod = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$paymentMethod', total: { $sum: 1 }, highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } } } }
    ]);

    const byTransactionType = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$transactionType', total: { $sum: 1 }, highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } } } }
    ]);

    res.json({
      riskDistribution,
      byPaymentMethod,
      byTransactionType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
