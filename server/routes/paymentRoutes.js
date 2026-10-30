const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  initiatePayment,
  verifyPaymentOtp,
  tokenizeCard,
} = require('../controllers/paymentController');

router.get('/methods', getPaymentMethods);
router.post('/initiate', initiatePayment);
router.post('/verify-otp', verifyPaymentOtp);
router.post('/tokenize-card', tokenizeCard);

module.exports = router;
