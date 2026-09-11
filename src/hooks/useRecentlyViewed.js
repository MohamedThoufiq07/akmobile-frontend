import { useState, useCallback } from 'react';

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse recently viewed', e);
    }
    return [];
  });

  const addRecentlyViewed = useCallback((product) => {
    if (!product || !product._id) return;

    setRecentlyViewed((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      // Remove if already exists
      const filtered = current.filter((p) => p._id !== product._id);

      // Add to front, keep max 10
      const updated = [product, ...filtered].slice(0, 10);

      try {
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recently viewed to localStorage', e);
      }
      return updated;
    });
  }, []);

  return { recentlyViewed, addRecentlyViewed };
};

export default useRecentlyViewed;
