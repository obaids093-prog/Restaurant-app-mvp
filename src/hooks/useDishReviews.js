import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

export function useDishReviews(menuItemId) {
  const [reviews, setReviews] = useState([]);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchReviews = useCallback(
    async (targetPage = 1, append = false) => {
      if (!menuItemId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient(
          `/api/menu/${menuItemId}/reviews?page=${targetPage}&limit=10`
        );

        if (!isMountedRef.current) return;

        const data = response?.data || {};
        const incomingReviews = Array.isArray(data.reviews) ? data.reviews : [];

        setReviews((prev) => (append ? [...prev, ...incomingReviews] : incomingReviews));
        setRatingAverage(Number(data.ratingAverage || 0));
        setRatingCount(Number(data.ratingCount || 0));
        setPage(data.page || targetPage);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err.message || 'Unable to load dish reviews');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [menuItemId]
  );

  useEffect(() => {
    if (menuItemId) {
      setReviews([]);
      setPage(1);
      fetchReviews(1, false);
    }
  }, [menuItemId, fetchReviews]);

  const reload = useCallback(() => {
    return fetchReviews(1, false);
  }, [fetchReviews]);

  const fetchMore = useCallback(() => {
    if (!isLoading && page < totalPages) {
      fetchReviews(page + 1, true);
    }
  }, [isLoading, page, totalPages, fetchReviews]);

  return {
    reviews,
    ratingAverage,
    ratingCount,
    isLoading,
    error,
    reload,
    fetchMore,
    hasMore: page < totalPages,
  };
}

export default useDishReviews;
