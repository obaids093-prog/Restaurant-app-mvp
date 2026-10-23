import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

export function useManagerAnalytics(initialRange = 'today', branchId = 'all') {
  const [data, setData] = useState(null);
  const [range, setRange] = useState(initialRange);
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

  const fetchAnalytics = useCallback(
    async (targetRange = range, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const queryBranch =
          branchId && branchId !== 'all' ? `&branch=${encodeURIComponent(branchId)}` : '';
        const res = await apiClient(`/api/analytics/summary?range=${targetRange}${queryBranch}`);
        if (!isMountedRef.current) return;

        setData(res?.data || null);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err.message || 'Unable to load analytics summary');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [range, branchId]
  );

  useEffect(() => {
    fetchAnalytics(range, false);
  }, [fetchAnalytics, range]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics(range, true);
  }, [fetchAnalytics, range]);

  return {
    data,
    range,
    setRange,
    isLoading,
    isRefreshing,
    error,
    refreshAnalytics,
    refetch: () => fetchAnalytics(range, false),
  };
}
