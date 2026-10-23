const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, managerOnly } = require('../middleware/auth');

// All analytics routes require authentication and manager privileges
router.use(protect);
router.use(managerOnly);

router.get('/summary', getAnalyticsSummary);

module.exports = router;
