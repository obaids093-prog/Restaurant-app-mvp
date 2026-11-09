const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  initiatePayment,
} = require('../controllers/paymentController');

router.get('/methods', getPaymentMethods);
router.post('/initiate', initiatePayment);

module.exports = router;
