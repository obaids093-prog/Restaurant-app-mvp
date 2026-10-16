const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reservation must belong to a user'],
    },
    customerName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Reservation must assign a table'],
    },
    date: {
      type: String, // e.g. "2026-10-15"
      required: [true, 'Please provide reservation date'],
      trim: true,
    },
    time: {
      type: String, // e.g. "19:00"
      required: [true, 'Please provide reservation time'],
      trim: true,
    },
    guests: {
      type: Number,
      required: [true, 'Please provide party size'],
      min: [1, 'Number of guests must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Confirmed', 'Completed', 'No-Show', 'Cancelled', 'Declined'],
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'Pending',
    },
    specialRequests: {
      type: String,
      default: '',
      trim: true,
    },
    branchId: {
      type: String,
      default: 'lhr_gulberg',
      trim: true,
    },
    branchName: {
      type: String,
      default: 'AURA • Gulberg III, Lahore',
      trim: true,
    },
    branchCity: {
      type: String,
      default: 'Lahore',
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// F-21: Unique compound partial index to prevent double bookings
reservationSchema.index(
  { table: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['Pending', 'Confirmed'] },
    },
  }
);

// F-24: Query indexes
reservationSchema.index({ user: 1 });
reservationSchema.index({ date: 1, time: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
