import { useState, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { WishlistContext } from './useWishlist';

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user, setUser } = useAuth();

  const [localWishlist, setLocalWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem('localWishlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('WishlistContext: Failed to parse local wishlist', e);
    }
    return [];
  });

  const wishlist = useMemo(() => {
    if (isAuthenticated) {
      return Array.isArray(user?.wishlist) ? user.wishlist : [];
    }
    return localWishlist;
  }, [isAuthenticated, user, localWishlist]);

  const toggleWishlist = useCallback(async (productId) => {
    const isWished = wishlist.some(item => (typeof item === 'object' && item !== null ? item._id === productId : item === productId));
    
    if (isAuthenticated) {
      try {
        const { data } = await api.put(`/auth/wishlist/${productId}`);
        if (setUser && user) {
          setUser({ ...user, wishlist: data.wishlist });
        }
        if (isWished) {
          toast.success('Removed from wishlist');
        } else {
          toast.success('Added to wishlist');
        }
      } catch {
        toast.error('Failed to update wishlist');
      }
    } else {
      // Local wishlist logic
      let updated;
      if (isWished) {
        updated = localWishlist.filter(item => (typeof item === 'object' && item !== null ? item._id !== productId : item !== productId));
        toast.success('Removed from wishlist');
      } else {
        updated = [...localWishlist, productId];
        toast.success('Added to wishlist');
      }
      setLocalWishlist(updated);
      try {
        localStorage.setItem('localWishlist', JSON.stringify(updated));
      } catch (e) {
        console.error('WishlistContext: Failed to save local wishlist', e);
      }
    }
  }, [wishlist, isAuthenticated, user, setUser, localWishlist]);

  const isInWishlist = useCallback((productId) => {
    if (!wishlist || !Array.isArray(wishlist)) return false;
    return wishlist.some(item => (typeof item === 'object' && item !== null ? item._id === productId : item === productId));
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
