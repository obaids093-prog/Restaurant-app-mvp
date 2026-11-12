const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  registerPushToken,
  unregisterPushToken,
} = require('../controllers/notificationController');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/schemas');

// All notification routes require authenticated user session
router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', validate(idParamSchema, 'params'), markAsRead);
router.post('/push-token', registerPushToken);
router.delete('/push-token', unregisterPushToken);

module.exports = router;
