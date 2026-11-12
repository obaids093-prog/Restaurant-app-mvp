// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTables,
  verifyTableQR,
  getTableStandees,
} = require('../controllers/tableController');
const validate = require('../middleware/validate');
const { tableQRVerifySchema } = require('../validators/schemas');

router.get('/', getTables);
router.post('/verify-qr', validate(tableQRVerifySchema), verifyTableQR);
router.get('/qr-standees', getTableStandees);

module.exports = router;
