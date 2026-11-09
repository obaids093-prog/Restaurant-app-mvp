// server/services/socketService.js
// ═══════════════════════════════════════════════════════════
// REAL-TIME WEBSOCKET SERVICE (Roadmap Item #2)
//
// Provides instant event delivery to connected clients via Socket.io,
// replacing the 10-second HTTP polling approach with sub-200ms updates.
//
// Architecture:
//   • JWT-authenticated socket connections
//   • Room-based routing: user:<userId> for personal events,
//     role:manager for broadcast kitchen/staff events
//   • Graceful fallback: clients that can't connect to WS
//     continue using HTTP polling seamlessly
// ═══════════════════════════════════════════════════════════

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

let io = null;

/**
 * Safely handles role room join requests with RBAC validation.
 * Prevents unauthorized clients from subscribing to the manager broadcast room.
 * @param {import('socket.io').Socket} socket
 * @param {string} requestedRole
 * @returns {boolean} Whether join was allowed
 */
const handleRoleJoin = (socket, requestedRole) => {
  if (requestedRole === 'manager') {
    if (socket._userRole !== 'manager') {
      console.warn(`[Socket.io] ⚠️ Unauthorized role:manager join rejected for socket ${socket.id} (user: ${socket._userId || 'anon'})`);
      if (typeof socket.emit === 'function') {
        socket.emit('error:unauthorized', {
          message: 'Manager authorization required to join manager room.',
        });
      }
      return false;
    }
    if (typeof socket.join === 'function') {
      socket.join('role:manager');
    }
    console.log(`[Socket.io] Verified manager ${socket._userId} joined role:manager room`);
    return true;
  }
  if (requestedRole === 'customer') {
    if (typeof socket.join === 'function') {
      socket.join('role:customer');
    }
    return true;
  }
  return false;
};

/**
 * Initialize Socket.io on the existing HTTP server
 * @param {import('http').Server} httpServer - The Node HTTP server instance
 * @returns {import('socket.io').Server} - The Socket.io server instance
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Permissive for dev; in production, restrict to app origins
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Aggressive ping settings for mobile reliability
    pingInterval: 25000,
    pingTimeout: 20000,
    // Allow long-polling fallback for environments that block WebSocket
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication Middleware ─────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // Allow unauthenticated connections (they just won't join any rooms)
      socket._userId = null;
      socket._userRole = null;
      return next();
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
      console.warn('[Socket.io] Invalid JWT token:', err.message);
      // Still allow connection but without auth context
      socket._userId = null;
      socket._userRole = null;
      return next();
    }
  });

  // ── Connection Handler ────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket._userId;

    if (userId) {
      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] ✅ User ${userId} connected (socket: ${socket.id})`);
    } else {
      console.log(`[Socket.io] Anonymous connection (socket: ${socket.id})`);
    }

    // ── Client declares their role for broadcast rooms ──────
    socket.on('join:role', (role) => {
      handleRoleJoin(socket, role);
    });

    // ── Client joins a specific order tracking room ─────────
    socket.on('join:order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('leave:order', (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    // ── Heartbeat / Ping-Pong for connection health ─────────
    socket.on('ping:client', () => {
      socket.emit('pong:server', { timestamp: Date.now() });
    });

    // ── Disconnection ───────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.io] ❌ User ${userId || 'anonymous'} disconnected (${reason})`
      );
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

/**
 * Emit order status update to:
 *   1. The specific order tracking room (customers watching this order)
 *   2. The ordering customer's personal room
 *   3. All managers (for KDS and dashboard updates)
 */
const emitOrderStatusUpdate = (order) => {
  if (!io) return;

  const payload = {
    orderId: order._id || order.id,
    status: order.status,
    updatedAt: order.updatedAt || new Date().toISOString(),
    order: order, // Full order for context
  };

  // Broadcast to the specific order room
  io.to(`order:${payload.orderId}`).emit('order:statusUpdated', payload);

  // Notify the customer who placed this order
  const customerId = order.user?._id || order.user || order.customerId;
  if (customerId) {
    io.to(`user:${customerId}`).emit('order:statusUpdated', payload);
  }

  // Notify all managers for KDS/dashboard
  io.to('role:manager').emit('order:statusUpdated', payload);
};

/**
 * Emit new order event to all managers (new order placed)
 */
const emitNewOrder = (order) => {
  if (!io) return;

  const payload = {
    orderId: order._id || order.id,
    order: order,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  // Notify all managers about new incoming order
  io.to('role:manager').emit('order:new', payload);

  // Also notify the customer in case they have multiple devices
  const customerId = order.user?._id || order.user || order.customerId;
  if (customerId) {
    io.to(`user:${customerId}`).emit('order:new', payload);
  }
};

/**
 * Emit notification to a specific user
 */
const emitNotification = (userId, notification) => {
  if (!io || !userId) return;

  io.to(`user:${userId}`).emit('notification:new', {
    notification,
    timestamp: Date.now(),
  });
};

/**
 * Emit notification to all managers
 */
const emitManagerNotification = (notification) => {
  if (!io) return;

  io.to('role:manager').emit('notification:new', {
    notification,
    timestamp: Date.now(),
  });
};

/**
 * Emit inventory alert (stock low / sold out)
 */
const emitInventoryAlert = (alert) => {
  if (!io) return;

  io.to('role:manager').emit('inventory:alert', {
    ...alert,
    timestamp: Date.now(),
  });
};

/**
 * Emit menu item availability change (sold out / back in stock)
 */
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
  handleRoleJoin,
  emitOrderStatusUpdate,
  emitNewOrder,
  emitNotification,
  emitManagerNotification,
  emitInventoryAlert,
  emitMenuUpdate,
};
