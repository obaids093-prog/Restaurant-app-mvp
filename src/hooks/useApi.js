/**
 * src/hooks/useApi.js
 * ═══════════════════════════════════════════════════════════
 * Custom hook to manage asynchronous API calls.
 *
 * Requirements (Question 6):
 *   - Returns { data, loading, error, refetch }
 *   - Used in at least two screens (e.g. MenuScreen, ManagerDashboardScreen, Reservations)
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

/**
 * Custom hook for data fetching
 * @param {string | Function} apiCall - Endpoint string (e.g. '/api/menu') OR async function returning data
 * @param {object} options - Initial options (autoFetch, initialData, params)
 * @returns {object} { data, loading, error, refetch, setData }
 */
export const useApi = (apiCall, options = {}) => {
  const { autoFetch = true, initialData = null, params = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (overrideParams) => {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        let result;
        if (typeof apiCall === 'function') {
          result = await apiCall(overrideParams !== undefined ? overrideParams : params);
        } else if (typeof apiCall === 'string') {
          // Construct query string if params supplied
          let endpoint = apiCall;
          const queryParams = overrideParams || params;
          if (queryParams && typeof queryParams === 'object') {
            const searchParams = new URLSearchParams();
            Object.entries(queryParams).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== '') {
                searchParams.append(k, v);
              }
            });
            const qs = searchParams.toString();
            if (qs) {
              endpoint += (endpoint.includes('?') ? '&' : '?') + qs;
            }
          }
          result = await apiClient(endpoint);
        }

        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          return result;
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Something went wrong');
          setLoading(false);
        }
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiCall, JSON.stringify(params)]
  );

  useEffect(() => {
    if (autoFetch) {
      execute().catch(() => {});
    }
  }, [execute, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
};

export default useApi;
