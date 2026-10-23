const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'order_status',     // Order status changed
        'review_reply',     // Manager replied to your review
        'loyalty_tier_up',  // Loyalty tier upgraded
        'loyalty_points',   // Points earned from order
        'voucher_expiring', // Voucher expiring soon
        'welcome',          // Welcome notification
        'general',          // General/system notification
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    // Reference to the related entity (order, review, etc.)
    refModel: {
      type: String,
      enum: ['Order', 'Review', 'MenuItem', 'Voucher', null],
      default: null,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient user notification queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
