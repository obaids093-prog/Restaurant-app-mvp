// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTables,
  verifyTableQR,
  getTableStandees,
} = require('../controllers/tableController');

router.get('/', getTables);
router.post('/verify-qr', verifyTableQR);
router.get('/qr-standees', getTableStandees);

module.exports = router;
