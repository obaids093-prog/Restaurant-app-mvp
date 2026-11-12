// server/models/AuditLog.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Stores immutable audit records of all manager administrative actions:
//     - Staff creation, deactivation, and demotion
//     - Menu dish creation, price/availability updates, deletion
//     - Order status transitions
//     - Promotional voucher creation, modification, toggling, deletion
//     - Inventory stock updates
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
      default: 'manager',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    target: {
      type: String,
      default: '',
    },
    targetModel: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index on createdAt for fast paginated timeline queries
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
