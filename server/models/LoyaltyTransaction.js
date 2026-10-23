const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a patron'],
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'bonus', 'adjustment'],
      required: [true, 'Transaction type is required'],
    },
    points: {
      type: Number,
      required: [true, 'Points amount is required'],
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after transaction is required'],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-speed retrieval of user loyalty ledger
loyaltyTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
