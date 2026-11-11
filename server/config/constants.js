// config/constants.js
// ═══════════════════════════════════════════════════════════
// Shared application constants across server, app, and docs
// ═══════════════════════════════════════════════════════════

/**
 * Maximum number of minutes after order creation during which
 * a customer can cancel their own Pending order.
 * Setting this to 0 disables the time-window check entirely.
 */
const CANCEL_WINDOW_MINUTES = 10;

/**
 * Standard fallback HTTP polling interval (in milliseconds)
 * for order status, kitchen display, and notification updates
 * when WebSocket events are reconnecting or unavailable.
 */
const POLLING_INTERVAL_MS = 10000;

module.exports = {
  CANCEL_WINDOW_MINUTES,
  POLLING_INTERVAL_MS,
};
