import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

export function useVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVouchers, setTotalVouchers] = useState(0);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchVouchers = useCallback(
    async (targetPage = 1, isRefresh = false, filter = statusFilter) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await apiClient(
          `/api/vouchers?page=${targetPage}&limit=20&status=${filter}`
        );
        if (!isMountedRef.current) return;

        const data = res?.data || {};
        const list = Array.isArray(data.vouchers) ? data.vouchers : [];

        setVouchers((prev) => (targetPage === 1 ? list : [...prev, ...list]));
        setPage(data.page || targetPage);
        setTotalPages(data.totalPages || 1);
        setTotalVouchers(data.total || list.length);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err.message || 'Unable to load vouchers');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchVouchers(1, false, statusFilter);
  }, [fetchVouchers, statusFilter]);

  const refreshVouchers = useCallback(() => {
    return fetchVouchers(1, true, statusFilter);
  }, [fetchVouchers, statusFilter]);

  const createVoucher = useCallback(
    async (voucherData) => {
      try {
        const res = await apiClient('/api/vouchers', {
          method: 'POST',
          body: voucherData,
        });
        const created = res?.data;
        if (isMountedRef.current && created) {
          setVouchers((prev) => [created, ...prev]);
          setTotalVouchers((prev) => prev + 1);
        }
        return { success: true, data: created };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to create voucher' };
      }
    },
    []
  );

  const updateVoucher = useCallback(
    async (id, updateData) => {
      try {
        const res = await apiClient(`/api/vouchers/${id}`, {
          method: 'PUT',
          body: updateData,
        });
        const updated = res?.data;
        if (isMountedRef.current && updated) {
          setVouchers((prev) =>
            prev.map((v) => (v._id === id ? updated : v))
          );
        }
        return { success: true, data: updated };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to update voucher' };
      }
    },
    []
  );

  const toggleVoucher = useCallback(
    async (id) => {
      try {
        const res = await apiClient(`/api/vouchers/${id}/toggle`, {
          method: 'PATCH',
        });
        const updated = res?.data;
        if (isMountedRef.current && updated) {
          setVouchers((prev) =>
            prev.map((v) => (v._id === id ? { ...v, isActive: updated.isActive } : v))
          );
        }
        return { success: true, data: updated };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to toggle voucher status' };
      }
    },
    []
  );

  const deleteVoucher = useCallback(
    async (id) => {
      try {
        await apiClient(`/api/vouchers/${id}`, {
          method: 'DELETE',
        });
        if (isMountedRef.current) {
          setVouchers((prev) => prev.filter((v) => v._id !== id));
          setTotalVouchers((prev) => Math.max(0, prev - 1));
        }
        return { success: true };
      } catch (err) {
        return { success: false, message: err.message || 'Failed to delete voucher' };
      }
    },
    []
  );

  const deactivateDemoVouchers = useCallback(async () => {
    try {
      const res = await apiClient('/api/vouchers/deactivate-demo', {
        method: 'POST',
      });
      if (isMountedRef.current) {
        await fetchVouchers(1, true, statusFilter);
      }
      return { success: true, count: res?.data?.modifiedCount || 0 };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to deactivate demo vouchers' };
    }
  }, [fetchVouchers, statusFilter]);

  return {
    vouchers,
    isLoading,
    isRefreshing,
    error,
    page,
    totalPages,
    totalVouchers,
    statusFilter,
    setStatusFilter,
    fetchVouchers,
    refreshVouchers,
    createVoucher,
    updateVoucher,
    toggleVoucher,
    deleteVoucher,
    deactivateDemoVouchers,
  };
}
export default useVouchers;
