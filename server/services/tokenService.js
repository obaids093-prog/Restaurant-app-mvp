// server/services/tokenService.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Manages 15-minute access tokens and rotating refresh tokens:
//     - Issues 15m access tokens
//     - Generates cryptographically secure random refresh tokens (stored hashed)
//     - Implements token family rotation with reuse detection
//     - Automatically revokes token families upon replay attack
// ═══════════════════════════════════════════════════════════

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Hash raw token with SHA-256
 */
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Generate 15-minute JWT Access Token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
};

/**
 * Create and persist a new rotating refresh token
 */
const createRefreshToken = async (userId, family = null) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const tokenFamily = family || crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: userId,
    tokenHash,
    family: tokenFamily,
    expiresAt,
  });

  return {
    rawToken,
    expiresAt,
  };
};

/**
 * Rotate refresh token with reuse detection
 */
const rotateRefreshToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    const error = new Error('Refresh token is required');
    error.status = 401;
    throw error;
  }

  const incomingHash = hashToken(rawToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash: incomingHash });

  if (!tokenDoc) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  // REUSE DETECTION: If this token was already revoked, someone is replaying an old token!
  // Invalidate the ENTIRE token family immediately.
  if (tokenDoc.revokedAt) {
    await RefreshToken.updateMany(
      { family: tokenDoc.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    const error = new Error('Refresh token reuse detected. Session invalidated.');
    error.status = 401;
    throw error;
  }

  // Expiration check
  if (tokenDoc.expiresAt < new Date()) {
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    const error = new Error('Refresh token has expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  // Issue new access and refresh token pair in the same family
  const newRawToken = crypto.randomBytes(32).toString('hex');
  const newHash = hashToken(newRawToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Mark current token as revoked and replaced
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = newHash;
  await tokenDoc.save();

  // Save new token
  await RefreshToken.create({
    user: tokenDoc.user,
    tokenHash: newHash,
    family: tokenDoc.family,
    expiresAt: newExpiresAt,
  });

  const accessToken = generateAccessToken(tokenDoc.user);

  return {
    accessToken,
    refreshToken: newRawToken,
    userId: tokenDoc.user,
  };
};

/**
 * Revoke a single refresh token (e.g. on logout)
 */
const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

/**
 * Revoke all tokens for a user (e.g. on password change, deactivation, deletion)
 */
const revokeAllUserTokens = async (userId) => {
  if (!userId) return;
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

module.exports = {
  hashToken,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
