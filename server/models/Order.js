const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Order item must reference a MenuItem'],
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Item price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  specialInstructions: {
    type: String,
    default: '',
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    customerName: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
      default: null,
      trim: true,
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsAwarded: {
      type: Boolean,
      default: false,
    },
    pointsRefunded: {
      type: Boolean,
      default: false,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    salesTax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative'],
    },
    deliveryAddress: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    orderType: {
      type: String,
      enum: ['Dine-in', 'Takeaway', 'Dine-In Table', 'Curbside', 'Priority', 'Delivery'],
      default: 'Dine-in',
    },
    tableNumber: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Preparing', 'Ready', 'On The Way', 'Served', 'Cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Pending',
    },
    notes: {
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
    paymentMethod: {
      type: String,
      enum: ['cash', 'pay_at_table'],
      default: 'pay_at_table',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Pending', 'Paid', 'Refunded'],
      default: 'Unpaid',
    },
    paymentRef: {
      type: String,
      default: '',
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// F-24: Query optimization indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
