const crypto = require('crypto');
const mongoose = require('mongoose');
const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');

// In-memory transaction registry for offline/test resilience
const memoryTransactions = new Map();

const AVAILABLE_PAYMENT_METHODS = [
  {
    id: 'pay_at_table',
    name: 'Pay at Table (Dine-in)',
    type: 'offline',
    icon: 'restaurant-outline',
    color: '#D4AF37',
    accent: '#FFF9C4',
    perk: 'Cash or Card with Waiter POS',
    fee: 0,
    description: 'Settle folio directly with server at dining table',
  },
  {
    id: 'cash',
    name: 'Cash on Counter / Delivery',
    type: 'offline',
    icon: 'cube-outline',
    color: '#546E7A',
    accent: '#ECEFF1',
    perk: 'Physical settlement at register or takeaway counter',
    fee: 0,
    description: 'Pay cash directly upon fulfillment',
  },
];

// @desc    Get supported payment methods
// @route   GET /api/payments/methods
// @access  Public
const getPaymentMethods = async (req, res) => {
  res.status(200).json({
    currency: 'PKR',
    methods: AVAILABLE_PAYMENT_METHODS,
  });
};

// @desc    Initiate payment session (Cash or Pay-at-table)
// @route   POST /api/payments/initiate
// @access  Public
const initiatePayment = async (req, res) => {
  try {
    const { amount, method, orderId } = req.body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount greater than zero is required.',
      });
    }

    if (!method || !AVAILABLE_PAYMENT_METHODS.some((m) => m.id === method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Only Cash and Pay-at-Table settlements are accepted.',
      });
    }

    const txnPrefix = method === 'cash' ? 'CASH' : 'TABLE';
    const transactionRef = `${txnPrefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const transactionData = {
      userId: req.user?._id || req.user?.id || null,
      orderId: orderId && mongoose.isValidObjectId(orderId) ? orderId : null,
      amount: numericAmount,
      currency: 'PKR',
      method,
      status: 'Pending',
      transactionRef,
      paidAt: null,
    };

    memoryTransactions.set(transactionRef, transactionData);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await PaymentTransaction.create(transactionData);
      } catch (dbErr) {
        console.warn('DB write for PaymentTransaction failed, using in-memory store:', dbErr.message);
      }
    }

    // If orderId provided, immediately update order
    if (orderId && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Order.findByIdAndUpdate(orderId, {
          paymentMethod: method,
          paymentStatus: 'Pending',
          paymentRef: transactionRef,
        });
      } catch {
        // silent fallback
      }
    }

    return res.status(200).json({
      success: true,
      transactionRef,
      method,
      amount: numericAmount,
      currency: 'PKR',
      requiresOtp: false,
      message: 'Payment preference saved successfully. Settlement will occur in-person.',
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment initiation error. Please try again.',
    });
  }
};

module.exports = {
  getPaymentMethods,
  initiatePayment,
  AVAILABLE_PAYMENT_METHODS,
  _memoryTransactions: memoryTransactions,
};
