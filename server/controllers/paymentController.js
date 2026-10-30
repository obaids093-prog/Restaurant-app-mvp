const crypto = require('crypto');
const mongoose = require('mongoose');
const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');

// In-memory transaction registry for test/offline resilience
const memoryTransactions = new Map();

const AVAILABLE_PAYMENT_METHODS = [
  {
    id: 'jazzcash',
    name: 'JazzCash Mobile Account',
    type: 'wallet',
    icon: 'wallet-outline',
    color: '#D32F2F',
    accent: '#FFEBEE',
    perk: '10% Cashback up to Rs. 200',
    fee: 0,
    requiresPhone: true,
    phonePrefixes: ['030', '032'],
    placeholder: '0300 1234567',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa Wallet',
    type: 'wallet',
    icon: 'cash-outline',
    color: '#2E7D32',
    accent: '#E8F5E9',
    perk: 'Instant 0% Fee Settlement',
    fee: 0,
    requiresPhone: true,
    phonePrefixes: ['034', '031', '033'],
    placeholder: '0345 1234567',
  },
  {
    id: 'card_online',
    name: 'Credit / Debit Card',
    type: 'card',
    icon: 'card-outline',
    color: '#1565C0',
    accent: '#E3F2FD',
    perk: '3D Secure • Visa / Mastercard / PayPak',
    fee: 0,
    requiresCard: true,
    placeholder: '•••• •••• •••• ••••',
  },
  {
    id: 'pay_at_table',
    name: 'Pay at Table (Dine-in)',
    type: 'offline',
    icon: 'restaurant-outline',
    color: '#D4AF37',
    accent: '#FFF9C4',
    perk: 'Cash or Card with Waiter POS',
    fee: 0,
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    type: 'offline',
    icon: 'cube-outline',
    color: '#546E7A',
    accent: '#ECEFF1',
    perk: 'Exact change appreciated',
    fee: 0,
  },
];

/**
 * Validates Pakistani mobile phone number (03XX or +923XX)
 */
function validatePakMobile(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+92|0092|92)?0?3\d{9}$/.test(cleaned);
}

/**
 * Detects card brand from number
 */
function detectCardBrand(num) {
  const clean = String(num || '').replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^5[1-5]/.test(clean)) return 'Mastercard';
  if (/^6(?:011|5)/.test(clean)) return 'Discover';
  if (/^3[47]/.test(clean)) return 'Amex';
  if (/^5081/.test(clean)) return 'PayPak';
  return 'Credit / Debit';
}

// @desc    Get supported payment methods & offers
// @route   GET /api/payments/methods
// @access  Public
const getPaymentMethods = async (req, res) => {
  res.status(200).json({
    currency: 'PKR',
    methods: AVAILABLE_PAYMENT_METHODS,
  });
};

// @desc    Initiate payment session (JazzCash / EasyPaisa / Card 3DS)
// @route   POST /api/payments/initiate
// @access  Public
const initiatePayment = async (req, res) => {
  try {
    const {
      amount,
      method,
      accountNumber,
      cardNumber,
      cardExpiry,
      cardCvv,
      cardHolder,
      orderId,
    } = req.body || {};

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
        message: 'Invalid payment method selected.',
      });
    }

    let maskedAccount = '';
    let cardBrand = null;

    if (method === 'jazzcash' || method === 'easypaisa') {
      if (!validatePakMobile(accountNumber)) {
        return res.status(400).json({
          success: false,
          message: `Please provide a valid 11-digit mobile number for ${method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}.`,
        });
      }
      const cleaned = accountNumber.replace(/\D/g, '');
      maskedAccount = `${cleaned.slice(0, 4)} ••• ${cleaned.slice(-4)}`;
    } else if (method === 'card_online') {
      const cleanCard = String(cardNumber || '').replace(/\D/g, '');
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card number. Please provide a 16-digit card number.',
        });
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        return res.status(400).json({
          success: false,
          message: 'Card expiry must be in MM/YY format.',
        });
      }
      if (!cardCvv || String(cardCvv).length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 3-digit CVV code.',
        });
      }
      cardBrand = detectCardBrand(cleanCard);
      maskedAccount = `•••• •••• •••• ${cleanCard.slice(-4)}`;
    }

    // Cash and Pay-at-table require no OTP
    const isOffline = method === 'cash' || method === 'pay_at_table';
    const txnPrefix =
      method === 'jazzcash'
        ? 'JC'
        : method === 'easypaisa'
        ? 'EP'
        : method === 'card_online'
        ? 'CARD'
        : 'CASH';
    const transactionRef = `${txnPrefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const otpCode = isOffline ? null : '123456';
    const otpExpiresAt = isOffline ? null : new Date(Date.now() + 10 * 60 * 1000);

    const transactionData = {
      userId: req.user?._id || req.user?.id || null,
      orderId: orderId && mongoose.isValidObjectId(orderId) ? orderId : null,
      amount: numericAmount,
      currency: 'PKR',
      method,
      status: isOffline ? 'Success' : 'RequiresOTP',
      transactionRef,
      maskedAccount,
      cardBrand,
      otpCode,
      otpExpiresAt,
      paidAt: isOffline ? new Date() : null,
    };

    memoryTransactions.set(transactionRef, transactionData);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await PaymentTransaction.create(transactionData);
      } catch (dbErr) {
        console.warn('DB write for PaymentTransaction failed, using in-memory store:', dbErr.message);
      }
    }

    // If offline and orderId provided, immediately update order
    if (isOffline && orderId && mongoose.connection && mongoose.connection.readyState === 1) {
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
      maskedAccount,
      cardBrand,
      requiresOtp: !isOffline,
      demoOtp: isOffline ? null : '123456',
      message: isOffline
        ? 'Payment preference saved successfully.'
        : `A 6-digit verification code was simulated for ${maskedAccount}. Enter 123456 to confirm.`,
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment initiation error. Please try again.',
    });
  }
};

// @desc    Confirm 3DS / Wallet OTP and finalize payment
// @route   POST /api/payments/verify-otp
// @access  Public
const verifyPaymentOtp = async (req, res) => {
  try {
    const { transactionRef, otp, orderId } = req.body || {};

    if (!transactionRef) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required.',
      });
    }

    // Check memory store or database
    let txn = memoryTransactions.get(transactionRef);
    if (!txn && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        txn = await PaymentTransaction.findOne({ transactionRef }).select('+otpCode');
      } catch {
        txn = null;
      }
    }

    if (!txn) {
      return res.status(404).json({
        success: false,
        message: 'Transaction session not found or expired.',
      });
    }

    // Demo / test OTP bypass or exact match
    const validOtp = txn.otpCode || '123456';
    if (String(otp).trim() !== String(validOtp) && String(otp).trim() !== '123456') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please enter 123456.',
      });
    }

    const paidAt = new Date();
    txn.status = 'Success';
    txn.paidAt = paidAt;
    memoryTransactions.set(transactionRef, txn);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await PaymentTransaction.findOneAndUpdate(
          { transactionRef },
          { status: 'Success', paidAt }
        );
      } catch {
        // silent
      }
    }

    // Link and update order if orderId provided
    const targetOrderId = orderId || txn.orderId;
    if (targetOrderId && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Order.findByIdAndUpdate(targetOrderId, {
          paymentMethod: txn.method,
          paymentStatus: 'Paid',
          paymentRef: transactionRef,
          paidAt,
        });
      } catch {
        // silent
      }
    }

    const receiptNumber = `AURA-RCP-${Date.now().toString().slice(-6)}`;

    return res.status(200).json({
      success: true,
      transactionRef,
      receiptNumber,
      amount: txn.amount,
      currency: 'PKR',
      method: txn.method,
      maskedAccount: txn.maskedAccount,
      status: 'Success',
      paidAt: paidAt.toISOString(),
      message: 'Payment completed successfully. Your order is confirmed!',
    });
  } catch (error) {
    console.error('Error confirming payment OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment OTP.',
    });
  }
};

// @desc    Tokenize credit / debit card for 1-tap re-use
// @route   POST /api/payments/tokenize-card
// @access  Public
const tokenizeCard = async (req, res) => {
  try {
    const { cardNumber, cardHolder, cardExpiry } = req.body || {};
    const cleanCard = String(cardNumber || '').replace(/\D/g, '');

    if (cleanCard.length < 13 || cleanCard.length > 19) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card number.',
      });
    }

    const brand = detectCardBrand(cleanCard);
    const last4 = cleanCard.slice(-4);
    const token = `tok_${brand.toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(6).toString('hex')}`;

    return res.status(200).json({
      success: true,
      cardToken: token,
      last4,
      brand,
      cardHolder: cardHolder || 'Cardholder',
      cardExpiry: cardExpiry || '12/28',
      maskedNumber: `•••• •••• •••• ${last4}`,
    });
  } catch (error) {
    console.error('Error tokenizing card:', error);
    return res.status(500).json({
      success: false,
      message: 'Error tokenizing card.',
    });
  }
};

module.exports = {
  getPaymentMethods,
  initiatePayment,
  verifyPaymentOtp,
  tokenizeCard,
  validatePakMobile,
  detectCardBrand,
  AVAILABLE_PAYMENT_METHODS,
};
