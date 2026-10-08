// config/constants.js
// ═══════════════════════════════════════════════════════════
// Shared application constants
// ═══════════════════════════════════════════════════════════

/**
 * Maximum number of minutes after order creation during which
 * a customer can cancel their own Pending order.
 * Setting this to 0 disables the time-window check entirely
 * (customer can cancel any Pending order regardless of age).
 */
const CANCEL_WINDOW_MINUTES = 10;

module.exports = { CANCEL_WINDOW_MINUTES };
