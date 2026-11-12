// routes/reservationRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Maps URL endpoints to reservationController methods:
//     POST  /api/reservations       (Book table, Customer)
//     GET   /api/reservations/my    (Get user bookings, Customer)
//     GET   /api/reservations       (Get all bookings, Manager)
//     PATCH /api/reservations/:id   (Accept/Decline, Manager)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
} = require('../controllers/reservationController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  reservationCreateSchema,
  reservationStatusUpdateSchema,
  idParamSchema,
} = require('../validators/schemas');

router
  .route('/')
  .post(protect, validate(reservationCreateSchema), createReservation)
  .get(protect, managerOnly, getAllReservations);

router.get('/my', protect, getMyReservations);
router.patch(
  '/:id',
  protect,
  validate(idParamSchema, 'params'),
  validate(reservationStatusUpdateSchema),
  updateReservationStatus
);

module.exports = router;
