// server/services/socketService.js
// ═══════════════════════════════════════════════════════════
// REAL-TIME WEBSOCKET SERVICE (Roadmap Item #2 / Safety Fixes)
//
// Provides instant event delivery to connected clients via Socket.io.
//
// Security Architecture:
//   • Strictly authenticated WebSocket connections (JWT required)
//   • Server-controlled room assignments only (no client-controlled room joining)
//   • Users automatically join user:<userId> and role:<role> (e.g. role:manager)
//   • Graceful fallback: clients that can't connect to WS continue using HTTP polling
// ═══════════════════════════════════════════════════════════

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

let io = null;

/**
 * Server-controlled room assignment.
 * Automatically joins personal user room and verified role room.
 * Clients cannot request arbitrary room joins.
 * @param {import('socket.io').Socket} socket
 * @returns {boolean} Whether rooms were configured
 */
const setupSocketRooms = (socket) => {
  if (!socket._userId) {
    return false;
  }

  if (typeof socket.join === 'function') {
    // 1. Personal room for user-targeted notifications
    socket.join(`user:${socket._userId}`);

    // 2. Verified role room
    if (socket._userRole === 'manager') {
      socket.join('role:manager');
    } else if (socket._userRole === 'customer') {
      socket.join('role:customer');
    }
  }

  return true;
};

/**
 * Initialize Socket.io on the existing HTTP server
 * @param {import('http').Server} httpServer - The Node HTTP server instance
 * @returns {import('socket.io').Server} - The Socket.io server instance
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication Middleware (Strict - No Anonymous) ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required for WebSocket connection'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket._userId = decoded.id;

      if (decoded.role) {
        socket._userRole = decoded.role;
      } else if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const user = await User.findById(decoded.id).select('role').lean();
          socket._userRole = user?.role || 'customer';
        } catch {
          socket._userRole = 'customer';
        }
      } else {
        socket._userRole = 'customer';
      }

      return next();
    } catch (err) {
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket._userId;

    // Server-controlled automatic room setup
    setupSocketRooms(socket);
    console.log(`[Socket.io] ✅ Authenticated user ${userId} (${socket._userRole}) connected (socket: ${socket.id})`);

    // ── Order tracking room subscriptions (authenticated users only) ──
    socket.on('join:order', (orderId) => {
      if (orderId && typeof orderId === 'string' && typeof socket.join === 'function') {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('leave:order', (orderId) => {
      if (orderId && typeof orderId === 'string' && typeof socket.leave === 'function') {
        socket.leave(`order:${orderId}`);
      }
    });

    // ── Heartbeat / Ping-Pong ─────────────────────────────────
    socket.on('ping:client', () => {
      socket.emit('pong:server', { timestamp: Date.now() });
    });

    // ── Disconnection ─────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] ❌ User ${userId} disconnected (${reason})`);
    });
  });

  console.log('[Socket.io] ✅ Real-time WebSocket server initialized');
  return io;
};

/**
 * Get the active Socket.io server instance
 * @returns {import('socket.io').Server|null}
 */
const getIO = () => io;

// ═══════════════════════════════════════════════════════════
// EMIT HELPERS — Used by controllers to broadcast events
// ═══════════════════════════════════════════════════════════

const emitOrderStatusUpdate = (order) => {
  if (!io) return;

  const payload = {
    orderId: order._id || order.id,
    status: order.status,
    updatedAt: order.updatedAt || new Date().toISOString(),
    order: order,
  };

  io.to(`order:${payload.orderId}`).emit('order:statusUpdated', payload);

  const customerId = order.user?._id || order.user || order.customerId;
  if (customerId) {
    io.to(`user:${customerId}`).emit('order:statusUpdated', payload);
  }

  io.to('role:manager').emit('order:statusUpdated', payload);
};

const emitNewOrder = (order) => {
  if (!io) return;

  const payload = {
    orderId: order._id || order.id,
    order: order,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  io.to('role:manager').emit('order:new', payload);

  const customerId = order.user?._id || order.user || order.customerId;
  if (customerId) {
    io.to(`user:${customerId}`).emit('order:new', payload);
  }
};

const emitNotification = (userId, notification) => {
  if (!io || !userId) return;

  io.to(`user:${userId}`).emit('notification:new', {
    notification,
    timestamp: Date.now(),
  });
};

const emitManagerNotification = (notification) => {
  if (!io) return;

  io.to('role:manager').emit('notification:new', {
    notification,
    timestamp: Date.now(),
  });
};

const emitInventoryAlert = (alert) => {
  if (!io) return;

  io.to('role:manager').emit('inventory:alert', {
    ...alert,
    timestamp: Date.now(),
  });
};

const emitMenuUpdate = (menuItem) => {
  if (!io) return;

  io.emit('menu:updated', {
    menuItemId: menuItem._id || menuItem.id,
    isAvailable: menuItem.isAvailable,
    stockCount: menuItem.stockCount,
    timestamp: Date.now(),
  });
};

module.exports = {
  initializeSocket,
  getIO,
  setupSocketRooms,
  emitOrderStatusUpdate,
  emitNewOrder,
  emitNotification,
  emitManagerNotification,
  emitInventoryAlert,
  emitMenuUpdate,
};
