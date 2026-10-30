const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    method: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'card_online', 'cash', 'pay_at_table'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Initiated', 'RequiresOTP', 'Success', 'Failed'],
      default: 'Initiated',
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    maskedAccount: {
      type: String,
      default: '',
    },
    cardBrand: {
      type: String,
      default: null,
    },
    otpCode: {
      type: String,
      select: false, // hidden from public queries
    },
    otpExpiresAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({ orderId: 1 });
paymentTransactionSchema.index({ transactionRef: 1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
