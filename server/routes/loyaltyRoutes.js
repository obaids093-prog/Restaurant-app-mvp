const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyLoyalty, quoteRedemption } = require('../controllers/loyaltyController');
const validate = require('../middleware/validate');
const { loyaltyQuoteSchema } = require('../validators/schemas');

// All loyalty routes require authenticated user session
router.use(protect);

router.get('/', getMyLoyalty);
router.post('/quote', validate(loyaltyQuoteSchema), quoteRedemption);

module.exports = router;
