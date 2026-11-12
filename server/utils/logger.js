// server/utils/logger.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Structured logger using Pino.
//   Automatically redacts sensitive fields (passwords, tokens, OTP codes, card CVVs)
//   and masks phone numbers to preserve patron privacy.
// ═══════════════════════════════════════════════════════════

const pino = require('pino');

/**
 * Mask phone number for logs: e.g. 03001234567 -> 0300***4567
 */
const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 8) return '***';
  return `${clean.slice(0, 4)}***${clean.slice(-4)}`;
};

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  redact: {
    paths: [
      'password',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'rawToken',
      'authorization',
      'headers.authorization',
      'code',
      'otp',
      'cardCvv',
      'cardPan',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = {
  logger,
  maskPhone,
};
