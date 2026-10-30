/**
 * src/context/SocketContext.js
 * ═══════════════════════════════════════════════════════════
 * REAL-TIME WEBSOCKET CONTEXT (Roadmap Item #2)
 *
 * Manages a persistent Socket.io connection to the backend,
 * authenticated via JWT token. Provides real-time event
 * subscriptions for orders, notifications, and menu updates.
 *
 * Features:
 *   • Auto-connects when user logs in, disconnects on logout
 *   • Joins user-specific rooms for targeted events
 *   • Exposes connection state (connected/reconnecting/disconnected)
 *   • Graceful fallback: if WebSocket fails, HTTP polling continues
 * ═══════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../api/client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'

  // Event listener registry: event -> Set of callbacks
  const listenersRef = useRef(new Map());

  /**
   * Subscribe to a socket event. Returns an unsubscribe function.
   * @param {string} event - The socket event name (e.g., 'order:statusUpdated')
   * @param {Function} callback - Handler function called with event data
   * @returns {Function} unsubscribe
   */
  const subscribe = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    // If socket is already connected, register the handler immediately
    if (socketRef.current?.connected) {
      socketRef.current.on(event, callback);
    }

    return () => {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    };
  }, []);

  /**
   * Emit a socket event to the server
   * @param {string} event - Event name
   * @param {*} data - Event payload
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // ── Socket Connection Lifecycle ──────────────────────────
  useEffect(() => {
    // Only connect when we have both a user and a token
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setConnectionState('disconnected');
      }
      return;
    }

    // Create socket connection with JWT auth
    const socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    // ── Connection Events ─────────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket.io] ✅ Connected:', socket.id);
      setIsConnected(true);
      setConnectionState('connected');

      // Join role-based room
      socket.emit('join:role', user.role || 'customer');

      // Re-register all subscribed event listeners
      for (const [event, callbacks] of listenersRef.current.entries()) {
        for (const cb of callbacks) {
          socket.on(event, cb);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] ❌ Disconnected:', reason);
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket.io] 🔄 Reconnecting... (attempt ${attempt})`);
      setConnectionState('reconnecting');
    });

    socket.on('reconnect', () => {
      console.log('[Socket.io] ✅ Reconnected');
      setIsConnected(true);
      setConnectionState('connected');

      // Re-join rooms after reconnection
      socket.emit('join:role', user.role || 'customer');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
      setConnectionState('disconnected');
    });

    // ── App State Management (foreground/background) ──────
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground — reconnect if needed
        if (!socket.connected) {
          socket.connect();
        }
      }
      appStateRef.current = nextState;
    });

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      appStateSub?.remove();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionState('disconnected');
    };
  }, [user?._id, user?.role, token]);

  // ── Convenience: Join/Leave order tracking room ─────────
  const joinOrderRoom = useCallback((orderId) => {
    if (orderId && socketRef.current?.connected) {
      socketRef.current.emit('join:order', orderId);
    }
  }, []);

  const leaveOrderRoom = useCallback((orderId) => {
    if (orderId && socketRef.current?.connected) {
      socketRef.current.emit('leave:order', orderId);
    }
  }, []);

  const value = useMemo(() => ({
    isConnected,
    connectionState,
    subscribe,
    emit,
    joinOrderRoom,
    leaveOrderRoom,
    socket: socketRef.current,
  }), [isConnected, connectionState, subscribe, emit, joinOrderRoom, leaveOrderRoom]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

const NOOP_FALLBACK = {
  isConnected: false,
  connectionState: 'disconnected',
  subscribe: () => () => {},
  emit: () => {},
  joinOrderRoom: () => {},
  leaveOrderRoom: () => {},
  socket: null,
};

export function useSocket() {
  const context = useContext(SocketContext);
  return context || NOOP_FALLBACK;
}

export default SocketContext;
