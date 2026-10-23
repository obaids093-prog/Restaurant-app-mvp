const User = require('../models/User');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Validates whether a token matches Expo's push token format
 */
function isExpoPushToken(token) {
  if (typeof token !== 'string') return false;
  return (
    token.startsWith('ExponentPushToken[') ||
    token.startsWith('ExpoPushToken[')
  );
}

/**
 * Register an Expo push token for an authenticated user
 */
async function registerPushToken(userId, token) {
  if (!token || typeof token !== 'string') {
    const error = new Error('A valid push token string is required');
    error.status = 400;
    throw error;
  }

  const cleanToken = token.trim();
  if (!isExpoPushToken(cleanToken)) {
    const error = new Error('Invalid Expo push token format');
    error.status = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { pushTokens: cleanToken } },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return { success: true, token: cleanToken };
}

/**
 * Unregister an Expo push token for an authenticated user (e.g. on logout)
 */
async function unregisterPushToken(userId, token) {
  if (!token || typeof token !== 'string') {
    const error = new Error('A valid push token string is required');
    error.status = 400;
    throw error;
  }

  const cleanToken = token.trim();
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { pushTokens: cleanToken } },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return { success: true, removedToken: cleanToken };
}

/**
 * Dispatch an Expo push notification to all active devices of a user
 */
async function sendPushToUser(userId, { title, body, data = {} }) {
  try {
    if (!userId || !title || !body) return { sent: 0 };

    const user = await User.findById(userId).select('pushTokens').lean();
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return { sent: 0 };
    }

    const validTokens = user.pushTokens.filter(isExpoPushToken);
    if (validTokens.length === 0) return { sent: 0 };

    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'aura-order-updates',
    }));

    // Send HTTP POST to Expo push service
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.warn(`[Push Service] Expo push endpoint responded with status ${response.status}`);
      return { sent: 0, status: response.status };
    }

    const result = await response.json();
    const tickets = Array.isArray(result?.data) ? result.data : [];

    // Remove any stale tokens reported as unregistered by Expo
    const deadTokens = [];
    tickets.forEach((ticket, idx) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        deadTokens.push(validTokens[idx]);
      }
    });

    if (deadTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushTokens: { $in: deadTokens } },
      });
    }

    return { sent: validTokens.length - deadTokens.length };
  } catch (err) {
    // Non-blocking: catch and log push errors so core flows are never disrupted
    console.warn('[Push Service] Notification dispatch error:', err.message);
    return { sent: 0, error: err.message };
  }
}

module.exports = {
  isExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  sendPushToUser,
};
