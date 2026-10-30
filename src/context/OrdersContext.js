import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export const OrdersContext = createContext(null);

const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];

// Helper to normalize backend order format with UI expectations
const normalizeOrder = (o) => ({
  ...o,
  id: o._id || o.id,
  _id: o._id || o.id,
  total: o.totalAmount !== undefined ? o.totalAmount : o.total,
  customerId: o.user?._id || o.user || o.customerId,
  customerName: o.customerName || o.user?.name || 'Valued Guest',
  type: o.orderType || 'Dine-in',
  branchId: o.branchId || 'lhr_gulberg',
  branchName: o.branchName || 'AURA • Gulberg III, Lahore',
  branchCity: o.branchCity || (String(o.branchName || '').toLowerCase().includes('islamabad') ? 'Islamabad' : 'Lahore'),
  timestamp: o.createdAt
    ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now',
});

export const OrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch orders (Customer calls /my, Manager calls /)
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = user.role === 'manager' ? '/api/orders' : '/api/orders/my';
      const data = await apiClient(endpoint);
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeOrder)
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          if (timeA && timeB && timeA !== timeB) return timeB - timeA;
          return String(b._id || b.id || '').localeCompare(String(a._id || a.id || ''));
        });
      setOrders(normalized);
      return normalized;
    } catch (err) {
      console.warn('Failed to fetch orders from server:', err.message);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch when user logs in or role changes
  useEffect(() => {
    if (user) {
      fetchOrders().catch(() => {});
    } else {
      setOrders([]);
    }
  }, [user, fetchOrders]);

  // Real-time WebSocket subscriptions for order updates & incoming orders
  useEffect(() => {
    if (!subscribe) return;

    // Listen for real-time status updates (e.g. Preparing, Ready, Served, Cancelled)
    const unsubStatus = subscribe('order:statusUpdated', (updatedOrder) => {
      if (!updatedOrder) return;
      const normalized = normalizeOrder(updatedOrder);
      setOrders((prev) => {
        const orderId = normalized.id || normalized._id;
        const exists = prev.some((o) => (o.id || o._id) === orderId);
        if (exists) {
          return prev.map((o) => ((o.id || o._id) === orderId ? { ...o, ...normalized } : o));
        }
        return [normalized, ...prev];
      });
    });

    // Listen for new orders (e.g. managers receiving instant order dispatches)
    const unsubNew = subscribe('order:new', (newOrder) => {
      if (!newOrder) return;
      const normalized = normalizeOrder(newOrder);
      setOrders((prev) => {
        const orderId = normalized.id || normalized._id;
        const exists = prev.some((o) => (o.id || o._id) === orderId);
        if (exists) return prev;
        return [normalized, ...prev];
      });
    });

    return () => {
      if (typeof unsubStatus === 'function') unsubStatus();
      if (typeof unsubNew === 'function') unsubNew();
    };
  }, [subscribe]);

  /**
   * Place an order via POST /api/orders (Question 7 requirement)
   * Server recalculates total and validates item availability.
   */
  const createOrder = useCallback(async (orderData) => {
    try {
      const payload = {
        items: (orderData.items || []).map((item) => ({
          menuItem: item.menuItem || item.id || item._id,
          name: item.name || '',
          quantity: item.quantity || 1,
          specialInstructions: item.specialInstructions || item.note || '',
        })),
        orderType: orderData.orderType || orderData.type || 'Dine-in',
        tableNumber: orderData.tableNumber || '',
        notes: orderData.notes || '',
        promoCode: orderData.promoCode || null,
        discountPercent: orderData.discountPercent || 0,
        branchId: orderData.branchId || 'lhr_gulberg',
        branchName: orderData.branchName || 'AURA • Gulberg III, Lahore',
        branchCity: orderData.branchCity || 'Lahore',
        paymentMethod: orderData.paymentMethod || 'pay_at_table',
        paymentStatus: orderData.paymentStatus || 'Pending',
        paymentRef: orderData.paymentRef || '',
      };

      const created = await apiClient('/api/orders', {
        method: 'POST',
        body: payload,
      });

      const normalized = normalizeOrder(created);
      setOrders((prev) => [normalized, ...prev]);
      return normalized;
    } catch (err) {
      console.error('Failed to place order:', err);
      throw err;
    }
  }, []);

  /**
   * Update status via PATCH /api/orders/:id/status (Question 7 requirement)
   */
  const updateOrderStatus = useCallback(async (orderId, nextStatus) => {
    try {
      const updated = await apiClient(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });

      const normalized = normalizeOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o._id === orderId ? normalized : o))
      );
      return normalized;
    } catch (err) {
      console.error('Failed to update order status:', err);
      throw err;
    }
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    return updateOrderStatus(orderId, 'Cancelled');
  }, [updateOrderStatus]);

  // Active orders (Pending, Preparing, Ready only) sorted newest first
  const activeOrders = useMemo(
    () =>
      (orders || [])
        .filter((o) => ACTIVE_STATUSES.includes(o.status))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders]
  );

  // Most recent active order
  const activeOrder = activeOrders[0] || null;

  const value = useMemo(
    () => ({
      orders,
      activeOrders,
      activeOrder,
      hasActiveOrder: Boolean(activeOrder),
      isLoading,
      error,
      fetchOrders,
      createOrder,
      updateOrderStatus,
      cancelOrder,
    }),
    [
      orders,
      activeOrders,
      activeOrder,
      isLoading,
      error,
      fetchOrders,
      createOrder,
      updateOrderStatus,
      cancelOrder,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
