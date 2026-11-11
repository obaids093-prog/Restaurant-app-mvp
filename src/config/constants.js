// src/config/constants.js
// ═══════════════════════════════════════════════════════════
// Shared application constants across server, app, and docs
// ═══════════════════════════════════════════════════════════

/**
 * Maximum number of minutes after order placement during which
 * a customer may cancel their own Pending order.
 */
export const CANCEL_WINDOW_MINUTES = 10;

/**
 * Standard fallback HTTP polling interval (in milliseconds)
 * for order status, kitchen display, and notification updates
 * when WebSocket events are reconnecting or unavailable.
 */
export const POLLING_INTERVAL_MS = 10000;

