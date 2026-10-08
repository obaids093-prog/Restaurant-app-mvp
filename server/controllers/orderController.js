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

// Valid status progression sequence
const STATUS_ORDER = ['Pending', 'Preparing', 'Ready', 'Served'];

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer or Manager)
const placeOrder = async (req, res) => {
  try {
    const { items, orderType, tableNumber, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
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

      // Fallback: If not found by ID or ID is legacy/custom, lookup by name
      if (!menuItemDoc && item.name) {
        menuItemDoc = await MenuItem.findOne({
          name: new RegExp(`^${item.name.trim()}$`, 'i'),
        });
      }

      // Secondary fallback: partial name matching
      if (!menuItemDoc && item.name) {
        const firstWord = item.name.trim().split(' ')[0];
        if (firstWord && firstWord.length > 2) {
          menuItemDoc = await MenuItem.findOne({
            name: new RegExp(firstWord, 'i'),
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
        specialInstructions: item.specialInstructions || '',
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

    const newOrder = await Order.create({
      user: req.user._id,
      customerName: req.user.name,
      items: verifiedItems,
      totalAmount: calculatedTotal,
      orderType: finalOrderType,
      tableNumber: tableNumber || '',
      status: 'Pending',
      notes: notes || '',
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: error.message || 'Server error placing order', error: error.message });
  }
};

// @desc    Get customer's own orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.menuItem', 'name price image category');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
};

// @desc    Get all orders (Manager operations)
// @route   GET /api/orders
// @access  Private/Manager
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price image');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error fetching all orders', error: error.message });
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
      if (currentStatus !== 'Pending') {
        return res.status(400).json({
          message: `Cannot cancel an order that is already '${currentStatus}'. Orders can only be cancelled while 'Pending'.`,
        });
      }
      order.status = 'Cancelled';
      await order.save();
      return res.status(200).json(order);
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

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating status', error: error.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
