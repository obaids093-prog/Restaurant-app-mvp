import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else if (pageToFetch === 1) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await apiClient(`/api/notifications?page=${pageToFetch}&limit=20`);
        if (!isMountedRef.current) return;
        if (res && res.success && res.data) {
          if (pageToFetch === 1) {
            setNotifications(res.data.notifications || []);
          } else {
            setNotifications((prev) => [...prev, ...(res.data.notifications || [])]);
          }
          setPage(res.data.page || 1);
          setTotalPages(res.data.totalPages || 1);
          setTotal(res.data.total || 0);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err.message || 'Unable to load notifications');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [user]
  );

  const prevUnreadCountRef = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient('/api/notifications/unread-count');
      if (isMountedRef.current && res && res.success && res.data) {
        const newCount = res.data.unreadCount || 0;
        setUnreadCount(newCount);
        if (newCount > prevUnreadCountRef.current) {
          fetchNotifications(1, true);
        }
        prevUnreadCountRef.current = newCount;
      }
    } catch {
      // Background poll failure silently swallowed
    }
  }, [user, fetchNotifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Auto-poll unread badge every 6 seconds when user is authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 6000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const refreshNotifications = useCallback(() => {
    return fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !isLoading && !isRefreshing) {
      fetchNotifications(page + 1, false);
    }
  }, [page, totalPages, isLoading, isRefreshing, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const res = await apiClient(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notificationId ? { ...item, isRead: true, readAt: new Date() } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await apiClient('/api/notifications/read-all', {
        method: 'PATCH',
      });
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    total,
    page,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    refreshNotifications,
    loadMore,
    markAsRead,
    markAllRead,
    fetchUnreadCount,
  };
}
