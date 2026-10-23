import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

export function useManagerReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reply submission state
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchReviews = useCallback(async (targetPage = 1, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient(`/api/reviews?page=${targetPage}&limit=15`);
      if (!isMountedRef.current) return;

      const data = res?.data || {};
      const list = Array.isArray(data.reviews) ? data.reviews : [];

      setReviews((prev) => (targetPage === 1 ? list : [...prev, ...list]));
      setPage(data.page || targetPage);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Unable to load customer reviews');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  const refreshReviews = useCallback(() => {
    return fetchReviews(1, true);
  }, [fetchReviews]);

  const replyToReview = useCallback(async (reviewId, replyText) => {
    if (!reviewId || !replyText || !replyText.trim()) {
      return { success: false, message: 'Reply text is required' };
    }

    setIsSubmittingReply(true);
    setReplyError(null);

    try {
      const res = await apiClient(`/api/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        body: { reply: replyText.trim() },
      });

      const updated = res?.data;
      if (isMountedRef.current && updated) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === updated._id ? { ...r, managerReply: updated.managerReply, managerReplyAt: updated.managerReplyAt } : r
          )
        );
      }

      return { success: true, data: updated };
    } catch (err) {
      const msg = err.message || 'Could not post manager reply';
      if (isMountedRef.current) {
        setReplyError(msg);
      }
      return { success: false, message: msg };
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingReply(false);
      }
    }
  }, []);

  return {
    reviews,
    isLoading,
    isRefreshing,
    error,
    page,
    totalPages,
    fetchReviews,
    refreshReviews,
    replyToReview,
    isSubmittingReply,
    replyError,
    setReplyError,
  };
}

export default useManagerReviews;
