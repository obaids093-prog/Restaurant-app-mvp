const notificationService = require('../services/notificationService');

// @desc    Get user's notifications (paginated)
// @route   GET /api/notifications
// @access  Private (Authenticated)
exports.getMyNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page,
      limit,
      unreadOnly,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error fetching notifications',
    });
  }
};

// @desc    Get unread notification count for badge
// @route   GET /api/notifications/unread-count
// @access  Private (Authenticated)
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error fetching unread count',
    });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Authenticated)
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error marking notification as read',
    });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private (Authenticated)
exports.markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error marking all notifications as read',
    });
  }
};

// @desc    Register user's Expo push token
// @route   POST /api/notifications/push-token
// @access  Private (Authenticated)
exports.registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    const pushNotificationService = require('../services/pushNotificationService');
    const result = await pushNotificationService.registerPushToken(req.user._id, token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error registering push token',
    });
  }
};

// @desc    Unregister user's Expo push token
// @route   DELETE /api/notifications/push-token
// @access  Private (Authenticated)
exports.unregisterPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    const pushNotificationService = require('../services/pushNotificationService');
    const result = await pushNotificationService.unregisterPushToken(req.user._id, token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error unregistering push token',
    });
  }
};
