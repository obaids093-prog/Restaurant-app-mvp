// controllers/reservationController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles table reservations with validation rules:
//     1. Capacity check: Table seats must accommodate requested party size.
//     2. Collision check: If the table is already booked for that date & time,
//        return HTTP 409 Conflict.
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private (Customer or Manager)
const createReservation = async (req, res) => {
  try {
    const { tableId, date, time, guests, specialRequests, customerName, phone } = req.body;

    if (!tableId || !date || !time || !guests) {
      return res.status(400).json({ message: 'Please provide tableId, date, time, and guests count' });
    }

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({ message: 'Invalid table ID format' });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const guestCount = parseInt(guests, 10);

    // Business Rule 1: Check capacity
    if (table.seats < guestCount) {
      return res.status(400).json({
        message: `Selected table (${table.tableNumber}) only has ${table.seats} seats, but you requested ${guestCount} guests.`,
      });
    }

    // Business Rule 2 (Question 7 Requirement):
    // Check if table is already booked at that date and time
    const existingBooking = await Reservation.findOne({
      table: table._id,
      date: date.trim(),
      time: time.trim(),
      status: { $in: ['Pending', 'Confirmed'] }, // active bookings
    });

    if (existingBooking) {
      return res.status(409).json({
        message: `Table ${table.tableNumber} is already booked for ${date} at ${time}. Please choose another time or table.`,
      });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      customerName: customerName || req.user.name,
      phone: phone || req.user.phone || '',
      table: table._id,
      date: date.trim(),
      time: time.trim(),
      guests: guestCount,
      specialRequests: specialRequests || '',
      status: 'Pending',
    });

    const populatedReservation = await Reservation.findById(reservation._id).populate('table');
    res.status(201).json(populatedReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error creating reservation', error: error.message });
  }
};

// @desc    Get customer's reservations
// @route   GET /api/reservations/my
// @access  Private
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('table');
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error fetching my reservations:', error);
    res.status(500).json({ message: 'Server error fetching reservations', error: error.message });
  }
};

// @desc    Get all reservations (Manager)
// @route   GET /api/reservations
// @access  Private/Manager
const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .sort({ date: 1, time: 1 })
      .populate('user', 'name email phone')
      .populate('table');
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error fetching all reservations', error: error.message });
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id
// @access  Private (Manager: any status | Customer: cancel own only)
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Declined', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const isManager = req.user.role === 'manager';
    const isOwner = reservation.user.toString() === req.user._id.toString();

    // Customers can only cancel their own reservations
    if (!isManager) {
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to modify this reservation' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel their reservations' });
      }
    }

    reservation.status = status;
    await reservation.save();

    const updated = await Reservation.findById(id).populate('table');
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: 'Server error updating reservation', error: error.message });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
};
