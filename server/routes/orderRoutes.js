// routes/orderRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Maps URL endpoints to orderController methods:
//     POST  /api/orders             (Place order, Customer)
//     GET   /api/orders/my          (Get user orders, Customer)
//     GET   /api/orders             (Get all orders, Manager)
//     PATCH /api/orders/:id/status  (Update status, Manager)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getRiderTracking,
  getOrderReceipt,
} = require('../controllers/orderController');
const { protect, managerOnly } = require('../middleware/auth');

router
  .route('/')
  .post(protect, placeOrder)
  .get(protect, managerOnly, getAllOrders);

router.get('/my', protect, getMyOrders);
router.patch('/:id/status', protect, updateOrderStatus);
router.get('/:id/rider-tracking', protect, getRiderTracking);
router.get('/:id/receipt', protect, getOrderReceipt);

module.exports = router;
