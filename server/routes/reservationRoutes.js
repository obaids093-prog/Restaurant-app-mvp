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

router
  .route('/')
  .post(protect, createReservation)
  .get(protect, managerOnly, getAllReservations);

router.get('/my', protect, getMyReservations);
router.patch('/:id', protect, managerOnly, updateReservationStatus);

module.exports = router;
