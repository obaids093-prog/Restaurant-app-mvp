// models/PasswordResetToken.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Stores SHA-256 hashed single-use password reset tokens.
//   Each token belongs to one user, expires in 30 minutes,
//   and is deleted from DB once consumed or expired (TTL index).
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Automatically remove expired tokens after 1 hour past their expiry
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

