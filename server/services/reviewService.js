const mongoose = require('mongoose');
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

/**
 * Atomically recalculate and update a dish's ratingAverage and ratingCount
 */
async function syncDishRating(menuItemId) {
  const itemObjectId = new mongoose.Types.ObjectId(menuItemId);
  const stats = await Review.aggregate([
    { $match: { menuItem: itemObjectId } },
    {
      $group: {
        _id: '$menuItem',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingCount = stats.length > 0 ? stats[0].count : 0;
  const ratingAverage = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

  await MenuItem.findByIdAndUpdate(menuItemId, {
    ratingAverage,
    ratingCount,
    rating: ratingAverage,
  });

  return { ratingAverage, ratingCount };
}

/**
 * Create a new review for a dish from a served order
 */
async function createReview(userId, { orderId, menuItemId, rating, comment }) {
  if (!orderId || !menuItemId || rating === undefined) {
    const error = new Error('orderId, menuItemId, and rating are required');
    error.status = 400;
    throw error;
  }

  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    const error = new Error('Rating must be an integer between 1 and 5');
    error.status = 400;
    throw error;
  }

  // Verify order exists, belongs to user, and is Served
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }

  if (order.user.toString() !== userId.toString()) {
    const error = new Error('You can only review dishes from your own orders');
    error.status = 403;
    throw error;
  }

  if (order.status !== 'Served') {
    const error = new Error('Reviews can only be submitted for Served orders');
    error.status = 400;
    throw error;
  }

  // Verify menuItem is part of this order
  const hasItem = order.items.some(
    (item) => item.menuItem && item.menuItem.toString() === menuItemId.toString()
  );
  if (!hasItem) {
    const error = new Error('The specified dish was not part of this order');
    error.status = 400;
    throw error;
  }

  // Check for existing review
  const existing = await Review.findOne({
    user: userId,
    order: orderId,
    menuItem: menuItemId,
  });
  if (existing) {
    const error = new Error('You have already reviewed this dish for this order');
    error.status = 400;
    throw error;
  }

  const sanitizedComment = typeof comment === 'string' ? comment.trim().slice(0, 300) : '';

  const review = await Review.create({
    user: userId,
    menuItem: menuItemId,
    order: orderId,
    rating: parsedRating,
    comment: sanitizedComment,
  });

  await syncDishRating(menuItemId);

  return Review.findById(review._id)
    .populate('user', 'name avatar')
    .populate('menuItem', 'name image');
}

/**
 * Get paginated reviews for a menu item (public)
 */
async function getMenuItemReviews(menuItemId, { page = 1, limit = 10 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;

  const [reviews, total, menuItem] = await Promise.all([
    Review.find({ menuItem: menuItemId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('user', 'name avatar')
      .lean(),
    Review.countDocuments({ menuItem: menuItemId }),
    MenuItem.findById(menuItemId).select('ratingAverage ratingCount name').lean(),
  ]);

  return {
    reviews,
    total,
    page: p,
    totalPages: Math.ceil(total / l) || 1,
    ratingAverage: menuItem?.ratingAverage ?? 0,
    ratingCount: menuItem?.ratingCount ?? 0,
  };
}

/**
 * Get reviews created by the current user
 */
async function getMyReviews(userId) {
  return Review.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('menuItem', 'name image category price ratingAverage ratingCount')
    .populate('order', 'status createdAt totalAmount')
    .lean();
}

/**
 * Edit review within 24 hours of creation (owner only)
 */
async function updateReview(reviewId, userId, { rating, comment }) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.status = 404;
    throw error;
  }

  if (review.user.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to edit this review');
    error.status = 403;
    throw error;
  }

  // 24-hour edit window rule
  const ageMs = Date.now() - new Date(review.createdAt).getTime();
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (ageMs > maxAgeMs) {
    const error = new Error('Reviews can only be edited within 24 hours of posting');
    error.status = 400;
    throw error;
  }

  if (rating !== undefined) {
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5');
      error.status = 400;
      throw error;
    }
    review.rating = parsedRating;
  }

  if (comment !== undefined) {
    review.comment = typeof comment === 'string' ? comment.trim().slice(0, 300) : '';
  }

  await review.save();
  await syncDishRating(review.menuItem);

  return Review.findById(review._id)
    .populate('user', 'name avatar')
    .populate('menuItem', 'name image');
}

/**
 * Manager reply to a review
 */
async function replyReview(reviewId, managerReplyText) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.status = 404;
    throw error;
  }

  const reply = typeof managerReplyText === 'string' ? managerReplyText.trim().slice(0, 300) : '';
  if (!reply) {
    const error = new Error('Manager reply text is required');
    error.status = 400;
    throw error;
  }

  review.managerReply = reply;
  review.managerReplyAt = new Date();
  await review.save();

  return Review.findById(review._id)
    .populate('user', 'name avatar')
    .populate('menuItem', 'name image');
}

/**
 * Delete review (owner or manager)
 */
async function deleteReview(reviewId, user) {
  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.status = 404;
    throw error;
  }

  const isOwner = review.user.toString() === user._id.toString();
  const isManager = user.role === 'manager';

  if (!isOwner && !isManager) {
    const error = new Error('You are not authorized to delete this review');
    error.status = 403;
    throw error;
  }

  const menuItemId = review.menuItem;
  await Review.findByIdAndDelete(reviewId);
  await syncDishRating(menuItemId);

  return { message: 'Review deleted successfully' };
}

/**
 * Get recent reviews across all dishes (Manager only)
 */
async function getAllReviews({ page = 1, limit = 20 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const [reviews, total] = await Promise.all([
    Review.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('user', 'name avatar email')
      .populate('menuItem', 'name image price category')
      .populate('order', 'totalAmount createdAt status')
      .lean(),
    Review.countDocuments(),
  ]);

  return {
    reviews,
    total,
    page: p,
    totalPages: Math.ceil(total / l) || 1,
  };
}

module.exports = {
  createReview,
  getMenuItemReviews,
  getMyReviews,
  getAllReviews,
  updateReview,
  replyReview,
  deleteReview,
  syncDishRating,
};
