const analyticsService = require('../services/analyticsService');

/**
 * @desc    Get executive analytics summary
 * @route   GET /api/analytics/summary
 * @access  Private (Manager Only)
 */
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { range = 'today', branch = 'all' } = req.query;

    const summary = await analyticsService.getAnalyticsSummary({
      range,
      branch,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('[ANALYTICS CONTROLLER ERROR]', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error computing analytics summary',
    });
  }
};
