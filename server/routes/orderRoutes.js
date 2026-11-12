// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderReceipt,
} = require('../controllers/orderController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  idParamSchema,
  orderCreateSchema,
  orderStatusUpdateSchema,
} = require('../validators/schemas');

router
  .route('/')
  .post(protect, validate({ body: orderCreateSchema }), placeOrder)
  .get(protect, managerOnly, getAllOrders);

router.get('/my', protect, getMyOrders);
router.patch('/:id/status', protect, validate({ params: idParamSchema, body: orderStatusUpdateSchema }), updateOrderStatus);
router.get('/:id/receipt', protect, validate({ params: idParamSchema }), getOrderReceipt);

module.exports = router;
