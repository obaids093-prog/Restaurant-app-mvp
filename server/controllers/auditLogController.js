// server/controllers/auditLogController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Retrieves paginated administrative audit logs for managers.
// ═══════════════════════════════════════════════════════════

const auditService = require('../services/auditService');

/**
 * @desc    Get paginated administrative audit logs
 * @route   GET /api/audit-logs
 * @access  Private (Manager Only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, action } = req.query;
    const result = await auditService.getAuditLogs({ page, limit, action });
    res.status(200).json({
      success: true,
      data: result.logs,
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ message: 'Server error retrieving audit logs' });
  }
};

module.exports = {
  getAuditLogs,
};
