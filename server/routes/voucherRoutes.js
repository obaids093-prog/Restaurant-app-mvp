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
const validate = require('../middleware/validate');
const {
  voucherValidateSchema,
  voucherCreateSchema,
  voucherUpdateSchema,
  idParamSchema,
} = require('../validators/schemas');

// Public endpoints
router.get('/active', getActiveVouchers);
router.post('/validate', validate(voucherValidateSchema), validateVoucher);

// Manager management routes
router.use(protect);
router.use(managerOnly);

router.route('/')
  .get(getAllVouchers)
  .post(validate(voucherCreateSchema), createVoucher);

router.route('/:id')
  .put(validate(idParamSchema, 'params'), validate(voucherUpdateSchema), updateVoucher)
  .delete(validate(idParamSchema, 'params'), deleteVoucher);

router.patch('/:id/toggle', validate(idParamSchema, 'params'), toggleVoucher);
router.post('/deactivate-demo', deactivateDemoVouchers);

module.exports = router;
