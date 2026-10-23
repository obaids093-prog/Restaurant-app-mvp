const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyLoyalty, quoteRedemption } = require('../controllers/loyaltyController');

// All loyalty routes require authenticated user session
router.use(protect);

router.get('/', getMyLoyalty);
router.post('/quote', quoteRedemption);

module.exports = router;
