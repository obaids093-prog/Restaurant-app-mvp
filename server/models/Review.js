const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu item is required'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [300, 'Comment cannot exceed 300 characters'],
      default: '',
    },
    managerReply: {
      type: String,
      trim: true,
      maxlength: [300, 'Reply cannot exceed 300 characters'],
      default: '',
    },
    managerReplyAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One review per dish per order
reviewSchema.index({ user: 1, order: 1, menuItem: 1 }, { unique: true });

// Optimized compound index for dish reviews sorted by creation time
reviewSchema.index({ menuItem: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
