const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Create a new notification for a user
 */
async function createNotification({ user, type, title, body, refModel = null, refId = null }) {
  if (!user) {
    const error = new Error('User ID is required to create a notification');
    error.status = 400;
    throw error;
  }

  if (!title || !body || !type) {
    const error = new Error('Type, title, and body are required fields');
    error.status = 400;
    throw error;
  }

  const notification = new Notification({
    user,
    type,
    title: String(title).trim(),
    body: String(body).trim(),
    refModel: refModel || null,
    refId: refId || null,
    isRead: false,
  });

  return await notification.save();
}

/**
 * Fetch notifications for a user with pagination & unread count
 */
async function getUserNotifications(userId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (options.unreadOnly === true || options.unreadOnly === 'true') {
    query.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    unreadCount,
  };
}

/**
 * Mark a single notification as read
 */
async function markAsRead(notificationId, userId) {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    const error = new Error('Invalid notification ID');
    error.status = 400;
    throw error;
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
async function markAllRead(userId) {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
    unreadCount: 0,
  };
}

/**
 * Get unread notification count for badge display
 */
async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({ user: userId, isRead: false });
  return { unreadCount: count };
}

/**
 * Helper: Notify customer about order status change
 */
async function notifyOrderStatus(order) {
  if (!order || !order.user || !order.status) return null;

  const shortId = String(order._id).slice(-4).toUpperCase();
  let title = `Order Status: ${order.status}`;
  let body = `Your order #${shortId} status has changed to ${order.status}.`;

  switch (order.status) {
    case 'Preparing':
      title = '🍳 Kitchen is Preparing Your Food';
      body = `Order #${shortId} is currently being prepared fresh by our chef.`;
      break;
    case 'Ready':
      title = '🍽️ Your Order is Ready!';
      body = `Order #${shortId} is hot and ready for ${order.orderType === 'Takeaway' ? 'pickup' : 'serving'}!`;
      break;
    case 'Served':
      title = '✨ Order Completed';
      body = `Order #${shortId} was served. Enjoy your meal! Don't forget to review your dishes.`;
      break;
    case 'Cancelled':
      title = '❌ Order Cancelled';
      body = `Order #${shortId} has been cancelled.`;
      break;
  }

  const notif = await createNotification({
    user: order.user,
    type: 'order_status',
    title,
    body,
    refModel: 'Order',
    refId: order._id,
  });

  try {
    const pushNotificationService = require('./pushNotificationService');
    await pushNotificationService.sendPushToUser(order.user, {
      title,
      body,
      data: {
        orderId: String(order._id),
        type: 'order_status',
        status: order.status,
      },
    });
  } catch (err) {
    // push error ignored
  }

  return notif;
}

/**
 * Helper: Notify reviewer when manager replies
 */
async function notifyReviewReply(review) {
  if (!review || !review.user) return null;

  const preview = review.managerReply
    ? review.managerReply.slice(0, 80) + (review.managerReply.length > 80 ? '...' : '')
    : 'Management has replied to your review.';

  const notif = await createNotification({
    user: review.user,
    type: 'review_reply',
    title: '💬 Management Replied to Your Review',
    body: preview,
    refModel: 'Review',
    refId: review._id,
  });

  try {
    const pushNotificationService = require('./pushNotificationService');
    await pushNotificationService.sendPushToUser(review.user, {
      title: '💬 Management Replied to Your Review',
      body: preview,
      data: {
        reviewId: String(review._id),
        dishId: String(review.menuItem),
        type: 'review_reply',
      },
    });
  } catch (err) {
    // push error ignored
  }

  return notif;
}

/**
 * Helper: Notify user of earned points and tier upgrade
 */
async function notifyLoyaltyPoints(userId, pointsEarned, totalPoints) {
  if (!userId || pointsEarned <= 0) return null;

  const notif = await createNotification({
    user: userId,
    type: 'loyalty_points',
    title: `🎁 +${pointsEarned} Loyalty Points!`,
    body: `You just earned ${pointsEarned} loyalty points! Your current balance is ${totalPoints} pts.`,
    refModel: null,
    refId: null,
  });

  try {
    const pushNotificationService = require('./pushNotificationService');
    await pushNotificationService.sendPushToUser(userId, {
      title: `🎁 +${pointsEarned} Loyalty Points!`,
      body: `You just earned ${pointsEarned} loyalty points! Your current balance is ${totalPoints} pts.`,
      data: { type: 'loyalty_points' },
    });
  } catch (err) {
    // push error ignored
  }

  return notif;
}

/**
 * Helper: Notify user of tier upgrade
 */
async function notifyTierUpgrade(userId, newTier) {
  if (!userId || !newTier) return null;

  return await createNotification({
    user: userId,
    type: 'loyalty_tier_up',
    title: `🏆 Tier Upgraded: ${newTier}!`,
    body: `Congratulations! You've advanced to ${newTier} VIP status with higher point multipliers.`,
    refModel: null,
    refId: null,
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount,
  notifyOrderStatus,
  notifyReviewReply,
  notifyLoyaltyPoints,
  notifyTierUpgrade,
};
