const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Voucher code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Code must be at least 3 characters'],
      maxlength: [20, 'Code cannot exceed 20 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [150, 'Description cannot exceed 150 characters'],
      default: '',
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: '{VALUE} is not a valid discount type',
      },
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1'],
      validate: {
        validator: function (val) {
          if (this.discountType === 'percentage') {
            return val <= 90;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 90%',
      },
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, 'Maximum discount cap cannot be negative'],
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Voucher expiration date is required'],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Usage limit must be at least 1'],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableBranchId: {
      type: String,
      default: 'all',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed lookup index for voucher validation
voucherSchema.index({ code: 1, isActive: 1 });
voucherSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
