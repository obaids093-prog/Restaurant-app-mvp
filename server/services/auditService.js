// server/services/auditService.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Records structured audit log entries in MongoDB for administrative
//   operations. Non-blocking (does not fail user requests on log write error).
// ═══════════════════════════════════════════════════════════

const AuditLog = require('../models/AuditLog');
const { logger } = require('../utils/logger');

/**
 * Log an administrative action to MongoDB AuditLog collection
 */
const logAction = async ({ actor, action, target = '', targetModel = '', details = {}, ip = '' }) => {
  try {
    if (!actor) return null;

    const entry = await AuditLog.create({
      actor: actor._id || actor.id,
      actorEmail: actor.email || 'unknown',
      actorRole: actor.role || 'manager',
      action,
      target: String(target),
      targetModel,
      details,
      ip: String(ip),
    });

    logger.info({ action, actor: actor.email, target, targetModel }, 'Administrative action recorded in audit log');
    return entry;
  } catch (err) {
    logger.warn({ error: err.message, action }, 'Failed to write audit log entry');
    return null;
  }
};

/**
 * Get paginated audit logs (manager only)
 */
const getAuditLogs = async ({ page = 1, limit = 20, action = null } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const query = {};
  if (action && typeof action === 'string' && action.trim()) {
    query.action = action.trim();
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('actor', 'name email role')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l) || 1,
  };
};

module.exports = {
  logAction,
  getAuditLogs,
};
