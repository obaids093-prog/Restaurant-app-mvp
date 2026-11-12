// server/routes/auditLogRoutes.js
const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, managerOnly } = require('../middleware/auth');

router.get('/', protect, managerOnly, getAuditLogs);

module.exports = router;
