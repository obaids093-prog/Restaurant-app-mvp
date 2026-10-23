const express = require('express');
const router = express.Router();
const {
  getActiveVouchers,
  validateVoucher,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  toggleVoucher,
  deleteVoucher,
  deactivateDemoVouchers,
} = require('../controllers/voucherController');
const { protect, managerOnly } = require('../middleware/auth');

// Public endpoints
router.get('/active', getActiveVouchers);
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
router.post('/deactivate-demo', deactivateDemoVouchers);

module.exports = router;
