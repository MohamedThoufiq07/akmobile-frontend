import { useState, useEffect, useRef } from 'react';

/**
 * useDelayedLoading Hook
 * Prevents skeleton flicker for super-fast network / cached responses.
 *
 * @param {boolean} isLoading - Whether the underlying async operation is running.
 * @param {number} delayMs - Milliseconds before skeleton becomes visible (default: 120ms).
 * @returns {boolean} - Whether to display the skeleton placeholder.
 */
export const useDelayedLoading = (isLoading, delayMs = 120) => {
  const [delayedLoading, setDelayedLoading] = useState(delayMs <= 0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (delayMs > 0) {
      timerRef.current = setTimeout(() => {
        setDelayedLoading(true);
      }, delayMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, delayMs]);

  if (!isLoading) {
    return false;
  }

  return delayMs <= 0 ? true : delayedLoading;
};

export default useDelayedLoading;
