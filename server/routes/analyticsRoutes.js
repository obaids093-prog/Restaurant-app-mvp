const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { analyticsQuerySchema } = require('../validators/schemas');

// All analytics routes require authentication and manager privileges
router.use(protect);
router.use(managerOnly);

router.get('/summary', validate(analyticsQuerySchema, 'query'), getAnalyticsSummary);

module.exports = router;
