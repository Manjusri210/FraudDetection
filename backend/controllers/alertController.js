const Transaction = require('../models/Transaction');

// @route   GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const { reviewed } = req.query;
    const query = {
      userId: req.user._id,
      riskLevel: { $in: ['HIGH', 'MEDIUM'] }
    };

    if (reviewed !== undefined) {
      query.reviewed = reviewed === 'true';
    }

    const alerts = await Transaction.find(query).sort({ createdAt: -1 });
    const unresolvedCount = await Transaction.countDocuments({
      userId: req.user._id,
      riskLevel: { $in: ['HIGH', 'MEDIUM'] },
      reviewed: false
    });

    res.json({
      alerts,
      unresolvedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PATCH /api/alerts/:id/review
exports.updateAlertReview = async (req, res) => {
  try {
    const { reviewed } = req.body;
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { reviewed: reviewed !== undefined ? reviewed : true },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Alert transaction not found' });
    }

    res.json({
      message: 'Alert status updated successfully',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
