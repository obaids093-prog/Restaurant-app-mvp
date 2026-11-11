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
const receiptService = require('../services/receiptService');
const inventoryService = require('../services/inventoryService');
const { emitNewOrder, emitOrderStatusUpdate } = require('../services/socketService');
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
        const validation = await voucherService.validateVoucher(cleanCode, subtotal, branchId, req.user._id);
        discountAmount = validation.discountAmount;
        appliedPromoCode = validation.code;
      } catch (err) {
        // Voucher errors are always 400 from the order perspective (bad client input)
        return res.status(400).json({ message: err.message || 'Invalid voucher code' });
      }
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
      status: 'Pending',
      notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
      branchId: branchId || 'lhr_gulberg',
      branchName: branchName || 'AURA • Gulberg III, Lahore',
      branchCity: branchCity || 'Lahore',
      paymentMethod: req.body.paymentMethod === 'cash' ? 'cash' : 'pay_at_table',
      paymentStatus: 'Pending',
      paymentRef: '',
      paidAt: null,
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

    // Deplete dish portions and auto sold-out if stock reaches 0
    try {
      await inventoryService.depleteOrderIngredients(newOrder);
    } catch (invErr) {
      console.warn('Inventory depletion error:', invErr.message);
    }

    // Broadcast new order to all connected clients in real-time
    emitNewOrder(newOrder);

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

      // Restore inventory portions and raw recipe ingredients
      try {
        await inventoryService.restoreOrderIngredients(cancelled);
      } catch (invErr) {
        console.warn('Failed to restore order inventory upon cancellation:', invErr.message);
      }

      // Notify the customer about their cancellation (same as manager path)
      try {
        await notificationService.notifyOrderStatus(cancelled);
      } catch (notifErr) {
        console.warn('Failed to notify order cancellation:', notifErr.message);
      }

      // Broadcast cancellation via WebSocket
      emitOrderStatusUpdate(cancelled);

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

      // Restore inventory portions and raw recipe ingredients
      try {
        await inventoryService.restoreOrderIngredients(order);
      } catch (invErr) {
        console.warn('Failed to restore order inventory upon cancellation:', invErr.message);
      }

      try {
        await notificationService.notifyOrderStatus(order);
      } catch (notifErr) {
        console.warn('Failed to notify order status:', notifErr.message);
      }

      // Broadcast manager cancellation via WebSocket
      emitOrderStatusUpdate(order);

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

    // Broadcast status progression via WebSocket
    emitOrderStatusUpdate(order);

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

// @desc    Get formatted WhatsApp digital receipt for an order
// @route   GET /api/orders/:id/receipt
// @access  Public or Protected
const getOrderReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).lean();
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const whatsAppText = receiptService.formatWhatsAppReceipt(order);
    const whatsAppUrl = receiptService.generateWhatsAppShareUrl(order.user?.phone, whatsAppText);

    res.status(200).json({
      orderId: order._id,
      ticketId: String(order._id).slice(-6).toUpperCase(),
      whatsAppText,
      whatsAppUrl,
      order,
    });
  } catch (error) {
    console.error('Error generating order receipt:', error);
    res.status(500).json({ message: 'Server error generating digital receipt' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderReceipt,
};
