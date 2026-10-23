const reviewService = require('../services/reviewService');

// @desc    Create review for dish in a served order
// @route   POST /api/reviews
// @access  Private (Customer)
exports.createReview = async (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;
    const review = await reviewService.createReview(req.user._id, {
      orderId,
      menuItemId,
      rating,
      comment,
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error creating review',
    });
  }
};

// @desc    Get paginated reviews for a menu item
// @route   GET /api/menu/:id/reviews
// @access  Public
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const data = await reviewService.getMenuItemReviews(req.params.id, { page, limit });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error fetching reviews',
    });
  }
};

// @desc    Get all reviews across dishes (Manager only)
// @route   GET /api/reviews
// @access  Private (Manager only)
exports.getAllReviews = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const data = await reviewService.getAllReviews({ page, limit });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error fetching manager reviews',
    });
  }
};

// @desc    Get logged in user's reviews
// @route   GET /api/reviews/my
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error fetching your reviews',
    });
  }
};

// @desc    Update review (owner only within 24h)
// @route   PATCH /api/reviews/:id
// @access  Private (Owner)
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const updated = await reviewService.updateReview(req.params.id, req.user._id, {
      rating,
      comment,
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error updating review',
    });
  }
};

// @desc    Manager reply to review
// @route   PATCH /api/reviews/:id/reply
// @access  Private (Manager only)
exports.replyReview = async (req, res) => {
  try {
    const { reply, managerReply } = req.body;
    const replyText = reply || managerReply;
    const updated = await reviewService.replyReview(req.params.id, replyText);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error replying to review',
    });
  }
};

// @desc    Delete review (owner or manager)
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Manager)
exports.deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error deleting review',
    });
  }
};
