const express = require('express');
const router = express.Router();
const {
  validateVoucher,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  toggleVoucher,
  deleteVoucher,
} = require('../controllers/voucherController');
const { protect, managerOnly } = require('../middleware/auth');

// Public validation endpoint for checkout
router.post('/validate', validateVoucher);

// Manager management routes
router.use(protect);
router.use(managerOnly);

router.route('/')
  .get(getAllVouchers)
  .post(createVoucher);

router.route('/:id')
  .put(updateVoucher)
  .delete(deleteVoucher);

router.patch('/:id/toggle', toggleVoucher);

module.exports = router;
