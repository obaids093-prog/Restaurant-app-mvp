import { useState, useCallback, useRef, useEffect } from 'react';
import apiClient from '../api/client';

export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetStatus = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const submitReview = useCallback(async ({ orderId, menuItemId, rating, comment }) => {
    if (!orderId || !menuItemId || !rating) {
      const msg = 'Order, dish, and rating are required.';
      setErrorMessage(msg);
      return { success: false, message: msg };
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient('/api/reviews', {
        method: 'POST',
        body: {
          orderId,
          menuItemId,
          rating: Number(rating),
          comment: typeof comment === 'string' ? comment.trim() : '',
        },
      });

      if (!isMountedRef.current) return { success: true };

      const msg = 'Thank you! Your verified dining review has been posted.';
      setSuccessMessage(msg);
      return { success: true, data: response?.data, message: msg };
    } catch (err) {
      if (!isMountedRef.current) return { success: false };
      const msg = err.message || 'Unable to submit review. Please try again.';
      setErrorMessage(msg);
      return { success: false, message: msg };
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, []);

  return {
    submitReview,
    isSubmitting,
    errorMessage,
    successMessage,
    resetStatus,
    setErrorMessage,
    setSuccessMessage,
  };
}

export default useSubmitReview;
