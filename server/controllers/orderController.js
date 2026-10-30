// controllers/orderController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles order creation, status progression, and queries.
//   Server-side validation rules (Question 7):
//     1. Never trust the total amount sent by the client! Client prices can be tampered with.
//        Server calculates line totals directly by looking up each MenuItem in MongoDB.
//     2. Unavailable items (isAvailable === false) are rejected immediately.
//     3. Status progression is strictly monotonic:
//        Pending -> Preparing -> Ready -> Served
//        An order can ONLY be Cancelled if its current status is 'Pending'.
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const voucherService = require('../services/voucherService');
const loyaltyService = require('../services/loyaltyService');
const notificationService = require('../services/notificationService');
const riderTrackingService = require('../services/riderTrackingService');
const { CANCEL_WINDOW_MINUTES } = require('../config/constants');

// Safe regex string escaper to prevent NoSQL regex injection / ReDoS (S1-A)
const escapeRegex = (str) => {
  return typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

// Valid status progression sequence
const STATUS_ORDER = ['Pending', 'Preparing', 'Ready', 'Served'];

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer or Manager)
const placeOrder = async (req, res) => {
  try {
    const { items, orderType, tableNumber, notes, branchId, branchName, branchCity } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (items.length > 50) {
      return res.status(400).json({ message: 'Cannot order more than 50 items at once' });
    }

    // Lookup menu items from database to compute real total and check availability
    const verifiedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const menuItemId = item.menuItem || item.id || item._id;

      let menuItemDoc = null;

      if (menuItemId && mongoose.Types.ObjectId.isValid(menuItemId)) {
        menuItemDoc = await MenuItem.findById(menuItemId);
      }

      // Fallback: If not found by ID or ID is legacy/custom, lookup by name with safe escaped regex
      if (!menuItemDoc && item.name && typeof item.name === 'string') {
        const safeName = escapeRegex(item.name.trim().slice(0, 100));
        menuItemDoc = await MenuItem.findOne({
          name: new RegExp(`^${safeName}$`, 'i'),
        });
      }

      // Secondary fallback: partial name matching with safe escaped regex
      if (!menuItemDoc && item.name && typeof item.name === 'string') {
        const firstWord = item.name.trim().split(' ')[0];
        if (firstWord && firstWord.length > 2) {
          const safeWord = escapeRegex(firstWord.slice(0, 50));
          menuItemDoc = await MenuItem.findOne({
            name: new RegExp(safeWord, 'i'),
          });
        }
      }

      if (!menuItemDoc) {
        return res.status(404).json({ message: `Menu item not found in catalog: ${item.name || menuItemId}` });
      }

      // Business Rule: Server rejects unavailable items
      if (!menuItemDoc.isAvailable) {
        return res.status(400).json({
          message: `Item "${menuItemDoc.name}" is currently sold out / unavailable.`,
        });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // CRITICAL SECURITY NOTE (Question 7 Requirement):
      // We calculate totalAmount on the server using menuItemDoc.price from MongoDB.
      // We do NOT trust any price or total sent by the client app to prevent price manipulation!
      const lineTotal = menuItemDoc.price * quantity;
      calculatedTotal += lineTotal;

      verifiedItems.push({
        menuItem: menuItemDoc._id,
        name: menuItemDoc.name,
        price: menuItemDoc.price,
        quantity,
        specialInstructions: typeof item.specialInstructions === 'string' ? item.specialInstructions.trim().slice(0, 300) : '',
      });
    }

    // Normalize orderType from UI variants ('Curbside', 'Dine-In Table', etc.)
    let finalOrderType = 'Dine-in';
    if (orderType) {
      const lower = String(orderType).toLowerCase();
      if (lower.includes('takeaway') || lower.includes('curbside')) {
        finalOrderType = 'Takeaway';
      } else {
        finalOrderType = 'Dine-in';
      }
    }

    // Compute financial totals: subtotal, discount, 5% service charge, 15% tax, nothing else
    const subtotal = calculatedTotal;
    let discountAmount = 0;
    let appliedPromoCode = null;

    if (req.body.promoCode && typeof req.body.promoCode === 'string' && req.body.promoCode.trim()) {
      const cleanCode = req.body.promoCode.trim().toUpperCase();
      try {
        const validation = await voucherService.validateVoucher(cleanCode, subtotal, branchId);
        discountAmount = validation.discountAmount;
        appliedPromoCode = validation.code;
      } catch (err) {
        // Fallback for legacy hardcoded promo codes if not seeded in DB
        const LEGACY_PROMO_CODES = {
          WELCOME10: 10,
          FEAST20: 20,
          AURA10: 10,
          AURA20: 20,
          AURA30: 30,
          AURA50: 50,
          SAVE10: 10,
          TASTY20: 20,
          CHEF15: 15,
          GOURMET30: 30,
        };
        if (err.status === 404 && LEGACY_PROMO_CODES[cleanCode]) {
          const percent = LEGACY_PROMO_CODES[cleanCode];
          discountAmount = Math.round(subtotal * (percent / 100));
          appliedPromoCode = cleanCode;
        } else {
          return res.status(400).json({ message: err.message || 'Invalid voucher code' });
        }
      }
    } else if (Number(req.body.discountPercent) > 0) {
      const discountPercent = Math.min(100, Math.max(0, Number(req.body.discountPercent)));
      discountAmount = Math.round(subtotal * (discountPercent / 100));
    }

    // Points Redemption (1 Point = Rs. 1, max 50% order subtotal)
    let pointsDiscountAmount = 0;
    let pointsToRedeem = 0;
    if (Number(req.body.pointsToRedeem) > 0) {
      pointsToRedeem = Math.floor(Number(req.body.pointsToRedeem));
      try {
        const quote = await loyaltyService.quoteRedemption(req.user._id, pointsToRedeem, subtotal);
        pointsDiscountAmount = quote.discountAmount;
      } catch (err) {
        return res.status(err.status || 400).json({ message: err.message || 'Cannot redeem loyalty points' });
      }
    }

    const totalDiscount = Math.min(subtotal, discountAmount + pointsDiscountAmount);
    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    const serviceCharge = discountedSubtotal * 0.05; // 5% Service Charge
    const salesTax = discountedSubtotal * 0.15;      // 15% Sales Tax
    const finalTotalAmount = discountedSubtotal + serviceCharge + salesTax;

    const newOrder = await Order.create({
      user: req.user._id,
      customerName: req.user.name,
      items: verifiedItems,
      subtotal,
      discountAmount,
      pointsRedeemed: pointsToRedeem,
      pointsDiscountAmount,
      promoCode: appliedPromoCode,
      serviceCharge,
      salesTax,
      totalAmount: Math.round(finalTotalAmount * 100) / 100,
      orderType: finalOrderType,
      tableNumber: typeof tableNumber === 'string' ? tableNumber.trim().slice(0, 80) : '',
      deliveryAddress: typeof req.body.deliveryAddress === 'string' ? req.body.deliveryAddress.trim().slice(0, 250) : '',
      status: 'Pending',
      notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
      branchId: branchId || 'lhr_gulberg',
      branchName: branchName || 'AURA • Gulberg III, Lahore',
      branchCity: branchCity || 'Lahore',
      paymentMethod: req.body.paymentMethod || 'pay_at_table',
      paymentStatus: req.body.paymentStatus || 'Pending',
      paymentRef: req.body.paymentRef || '',
      paidAt: req.body.paymentStatus === 'Paid' ? new Date() : null,
    });

    if (appliedPromoCode) {
      try {
        await voucherService.recordVoucherUsage(appliedPromoCode);
      } catch (usageErr) {
        console.warn('Failed to record voucher usage:', usageErr.message);
      }
    }

    if (pointsToRedeem > 0) {
      try {
        await loyaltyService.redeemPoints(req.user._id, pointsToRedeem, newOrder._id, subtotal);
      } catch (ptsErr) {
        console.warn('Failed to deduct redeemed points:', ptsErr.message);
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error placing order' });
  }
};

// @desc    Get customer's own orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate('items.menuItem', 'name price image category');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc    Get all orders (Manager operations)
// @route   GET /api/orders
// @access  Private/Manager
const getAllOrders = async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
    const orders = await Order.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price image');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error fetching all orders' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Manager: full progression | Customer: cancel own Pending only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = order.status;
    const isManager = req.user.role === 'manager';
    const isOwner = order.user.toString() === req.user._id.toString();

    // --- Customer authorization ---
    if (!isManager) {
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to modify this order' });
      }
      if (targetStatus !== 'Cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel their orders' });
      }

      // Time window check (0 = disabled)
      if (CANCEL_WINDOW_MINUTES > 0 && order.createdAt) {
        const ageMs = Date.now() - new Date(order.createdAt).getTime();
        const windowMs = CANCEL_WINDOW_MINUTES * 60 * 1000;
        if (ageMs > windowMs) {
          return res.status(400).json({
            message: `Cancellation window has expired. Orders can only be cancelled within ${CANCEL_WINDOW_MINUTES} minutes of placement.`,
          });
        }
      }

      // Atomic cancel: filter ensures order is still Pending AND owned by this user
      const cancelled = await Order.findOneAndUpdate(
        { _id: id, user: req.user._id, status: 'Pending' },
        { status: 'Cancelled' },
        { new: true }
      );

      if (!cancelled) {
        return res.status(400).json({ message: 'Order can no longer be cancelled (status may have changed).' });
      }

      // Refund any redeemed loyalty points atomically
      await loyaltyService.refundOrderPoints(cancelled._id);

      // Notify the customer about their cancellation (same as manager path)
      try {
        await notificationService.notifyOrderStatus(cancelled);
      } catch (notifErr) {
        console.warn('Failed to notify order cancellation:', notifErr.message);
      }

      return res.status(200).json(cancelled);
    }

    // --- Manager: full status progression ---
    // Check cancellation rule:
    // "An order can be Cancelled only while it is Pending"
    if (targetStatus === 'Cancelled') {
      if (currentStatus !== 'Pending') {
        return res.status(400).json({
          message: `Cannot cancel an order that is already '${currentStatus}'. Orders can only be cancelled while 'Pending'.`,
        });
      }
      order.status = 'Cancelled';
      await order.save();

      // Refund any redeemed loyalty points atomically
      await loyaltyService.refundOrderPoints(order._id);

      try {
        await notificationService.notifyOrderStatus(order);
      } catch (notifErr) {
        console.warn('Failed to notify order status:', notifErr.message);
      }

      return res.status(200).json(order);
    }

    // Check forward progression rule:
    // Status can only go forward: Pending -> Preparing -> Ready -> Served
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const targetIndex = STATUS_ORDER.indexOf(targetStatus);

    if (targetIndex === -1) {
      return res.status(400).json({
        message: `Invalid status: '${targetStatus}'. Allowed statuses: ${STATUS_ORDER.join(', ')}, Cancelled`,
      });
    }

    // Can only move forward (targetIndex > currentIndex)
    if (targetIndex <= currentIndex) {
      return res.status(400).json({
        message: `Status cannot move backwards or remain identical. Current status is '${currentStatus}', target is '${targetStatus}'.`,
      });
    }

    order.status = targetStatus;
    await order.save();

    // Notify customer about order progress in real-time
    try {
      await notificationService.notifyOrderStatus(order);
    } catch (notifErr) {
      console.warn('Failed to notify order status:', notifErr.message);
    }

    // If order reached 'Served', award loyalty points to patron!
    if (targetStatus === 'Served') {
      try {
        await loyaltyService.awardOrderPoints(order._id);
      } catch (awardErr) {
        console.warn('Failed to award loyalty points:', awardErr.message);
      }
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

// ── Get Rider Telemetry & Route Waypoints ─────────────────────
// GET /api/orders/:id/rider-tracking
// Protected: Authenticated Customer or Manager
const getRiderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await riderTrackingService.getOrderRiderTracking(id);
    if (!tracking) {
      return res.status(404).json({ message: 'Order not found for rider tracking' });
    }

    res.status(200).json(tracking);
  } catch (error) {
    console.error('Error fetching rider tracking:', error);
    res.status(500).json({ message: 'Server error retrieving rider telemetry' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getRiderTracking,
};
