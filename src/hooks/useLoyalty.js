import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useLoyalty() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState(null);
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

  const fetchLoyalty = useCallback(async (isRefresh = false) => {
    if (!user) {
      setLoyalty(null);
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient('/api/loyalty');
      if (!isMountedRef.current) return;
      if (res && res.success && res.data) {
        setLoyalty(res.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Unable to load loyalty profile');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchLoyalty(false);
  }, [fetchLoyalty]);

  const refreshLoyalty = useCallback(() => {
    return fetchLoyalty(true);
  }, [fetchLoyalty]);

  const quoteRedemption = useCallback(async (points, subtotal) => {
    try {
      const res = await apiClient('/api/loyalty/quote', {
        method: 'POST',
        body: { points, subtotal },
      });
      return { success: true, data: res?.data };
    } catch (err) {
      return { success: false, message: err.message || 'Points redemption quote failed' };
    }
  }, []);

  return {
    loyalty,
    points: loyalty?.points || 0,
    lifetimePoints: loyalty?.lifetimePoints || 0,
    tier: loyalty?.tier || 'Bronze',
    multiplier: loyalty?.multiplier || 1.0,
    bonusPercent: loyalty?.bonusPercent || 0,
    perks: loyalty?.perks || '',
    nextTier: loyalty?.nextTier,
    pointsToNextTier: loyalty?.pointsToNextTier || 0,
    progressPercent: loyalty?.progressPercent || 0,
    history: loyalty?.history || [],
    isLoading,
    isRefreshing,
    error,
    refreshLoyalty,
    quoteRedemption,
  };
}

export default useLoyalty;
