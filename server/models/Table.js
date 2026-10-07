const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Please provide a table number'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a table name'],
      trim: true,
    },
    seats: {
      type: Number,
      required: [true, 'Please provide number of seats'],
      min: [1, 'Seats must be at least 1'],
    },
    location: {
      type: String,
      required: [true, 'Please provide table location'],
      trim: true,
    },
    isWindow: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Table', tableSchema);
