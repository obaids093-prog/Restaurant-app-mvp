const loyaltyService = require('../services/loyaltyService');

// @desc    Get current user's loyalty profile, tier, and transaction ledger
// @route   GET /api/loyalty
// @access  Private (Authenticated customer/manager)
exports.getMyLoyalty = async (req, res) => {
  try {
    const summary = await loyaltyService.getLoyaltySummary(req.user._id);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error retrieving loyalty profile',
    });
  }
};

// @desc    Quote points redemption discount for an order subtotal
// @route   POST /api/loyalty/quote
// @access  Private (Authenticated customer/manager)
exports.quoteRedemption = async (req, res) => {
  try {
    const { points, subtotal } = req.body;
    const quote = await loyaltyService.quoteRedemption(req.user._id, points, subtotal);
    res.status(200).json({ success: true, data: quote });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error quoting points redemption',
    });
  }
};
