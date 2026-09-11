import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiChevronRight, FiHeart } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo_dark_text.png';
import api from '../../utils/api';
import SearchDropdown from './SearchDropdown';
import { normalizeProductsResponse } from '../../utils/apiHelper';
import SkeletonCircle from '../ui/skeleton/SkeletonCircle';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
} from '../../utils/recentSearches';

const Header = () => {
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const { cartItemCount } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Search dropdown & history state (lazy initial state for localStorage)
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const hamburgerBtnRef = useRef(null);
  const drawerRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  const isActive = (path, exactSearch = '') => {
    if (exactSearch) {
      return pathname === path && search === exactSearch;
    }
    return pathname === path;
  };

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body scroll lock and focus management for mobile drawer
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus first interactive element inside drawer
      const focusable = drawerRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else {
      document.body.style.overflow = '';
      if (hamburgerBtnRef.current && document.activeElement && drawerRef.current?.contains(document.activeElement)) {
        hamburgerBtnRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isMenuOpen]);

  // Global escape key listener to close menu, search, or dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchDropdownOpen(false);
        setIsMobileSearchOpen(false);
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(e.target);
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Debounced search suggestions fetch with AbortController and request ID
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const abortController = new AbortController();
    const currentRequestId = ++activeRequestIdRef.current;

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      setSuggestionError(null);

      try {
        const { data } = await api.get('/products/', {
          params: { search: trimmed, limit: 6 },
          signal: abortController.signal,
        });

        if (activeRequestIdRef.current === currentRequestId) {
          const list = normalizeProductsResponse(data);
          setSuggestions(list.slice(0, 6));
          setLoadingSuggestions(false);
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          // Ignore cancelled requests safely without setting error
          return;
        }
        if (activeRequestIdRef.current === currentRequestId) {
          console.error('Error fetching search suggestions:', err);
          setSuggestionError('Failed to load suggestions');
          setSuggestions([]);
          setLoadingSuggestions(false);
        }
      }
    }, 280);

    return () => {
      abortController.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const executeSearch = (term) => {
    const cleanTerm = (term || '').trim();
    if (!cleanTerm) return;

    const updated = saveRecentSearch(cleanTerm);
    setRecentSearches(updated);
    setIsSearchDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setIsMenuOpen(false);
    navigate(`/search?q=${encodeURIComponent(cleanTerm)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0) {
      if (!searchQuery.trim()) {
        const item = recentSearches[activeIndex];
        if (item) {
          executeSearch(item);
          return;
        }
      } else {
        const product = suggestions[activeIndex];
        if (product) {
          handleSelectSuggestion(product);
          return;
        }
      }
    }
    executeSearch(searchQuery);
  };

  const handleSelectRecent = (term) => {
    setSearchQuery(term);
    executeSearch(term);
  };

  const handleRemoveRecent = (term) => {
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    clearAllRecentSearches();
    setRecentSearches([]);
  };

  const handleSelectSuggestion = (product) => {
    if (!product) return;
    const queryToSave = searchQuery.trim() || product.name;
    const updated = saveRecentSearch(queryToSave);
    setRecentSearches(updated);
    setIsSearchDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setIsMenuOpen(false);
    navigate(`/products/${product._id}`);
  };

  const handleInputKeyDown = (e) => {
    const itemsCount = !searchQuery.trim() ? recentSearches.length : suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSearchDropdownOpen) {
        setIsSearchDropdownOpen(true);
      }
      setActiveIndex((prev) => (prev < itemsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : itemsCount - 1));
    } else if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIndex(-1); // Clear highlighted suggestion when query changes
    if (!val.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionError(null);
    }
    setIsSearchDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setRecentSearches(getRecentSearches());
    setActiveIndex(-1);
    setIsSearchDropdownOpen(true);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 py-3 border-b bg-white border-slate-200/80 transition-shadow duration-200 ${scrolled ? 'shadow-md shadow-slate-100/10' : ''}`}>
        <div className="w-full pl-2 pr-4 md:pl-4 md:pr-8 xl:pl-6 xl:pr-12 flex items-center justify-between gap-4 lg:gap-8">

          {/* 1. Logo */}
          <Link to="/" className="z-50 group shrink-0 flex items-center">
            <img
              src={logo}
              alt="AK Mobiles"
              className="w-auto h-12 object-contain transition-transform duration-300 group-hover:scale-105 -translate-y-1"
            />
          </Link>

          {/* 2. Desktop Search Bar with Live Suggestions and Recent Searches */}
          <div ref={desktopSearchRef} className="hidden lg:block relative flex-grow max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative w-full group" role="search">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={20} />
              <input
                type="text"
                role="combobox"
                aria-expanded={isSearchDropdownOpen}
                aria-autocomplete="list"
                aria-controls="desktop-search-suggestions"
                placeholder="Search for smartphones, brands, accessories..."
                className="w-full py-2.5 pl-12 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all text-slate-800 placeholder-slate-400 text-sm rounded-full"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-blue hover:bg-brand-blueHover text-white py-1.5 px-4 rounded-full text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            <SearchDropdown
              isOpen={isSearchDropdownOpen}
              query={searchQuery}
              recentSearches={recentSearches}
              suggestions={suggestions}
              loading={loadingSuggestions}
              error={suggestionError}
              activeIndex={activeIndex}
              onSelectRecent={handleSelectRecent}
              onRemoveRecent={handleRemoveRecent}
              onClearAllRecent={handleClearAllRecent}
              onSelectSuggestion={handleSelectSuggestion}
              onClose={() => setIsSearchDropdownOpen(false)}
              listboxId="desktop-search-suggestions"
            />
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 shrink-0">
            {/* 3. Home */}
            <Link to="/" className={`font-semibold transition-colors relative group ${isActive('/') ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
              Home
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-blue transition-all ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
            {/* 4. Shop */}
            <Link to="/products" className={`font-semibold transition-colors relative group ${isActive('/products') && !search ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
              Shop
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-blue transition-all ${isActive('/products') && !search ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>

            {/* 6. About */}
            <Link to="/about" className={`font-semibold transition-colors relative group ${isActive('/about') ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
              About
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-blue transition-all ${isActive('/about') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
            {/* 7. Contact */}
            <Link to="/contact" className={`font-semibold transition-colors relative group ${isActive('/contact') ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
              Contact
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-brand-blue transition-all ${isActive('/contact') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
          </nav>

          {/* Actions (Search, Wishlist, Cart & User Profile) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 z-50 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setRecentSearches(getRecentSearches());
                    setIsSearchDropdownOpen(true);
                  } else {
                    setIsSearchDropdownOpen(false);
                  }
                  return next;
                });
              }}
              className={`lg:hidden relative p-2 transition-all rounded-full ${
                isMobileSearchOpen
                  ? 'text-brand-blue bg-pink-50 ring-2 ring-brand-blue/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Toggle search"
            >
              <FiSearch size={22} />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative text-slate-600 hover:text-red-500 transition-colors p-2">
              <FiHeart size={22} />
              {wishlist?.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold border border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-slate-600 hover:text-slate-900 transition-colors p-2">
              <FiShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold border border-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* 8. User Profile / Login */}
            <div className="relative hidden md:block">
              {authLoading ? (
                <div className="p-1.5 flex items-center justify-center">
                  <SkeletonCircle size={32} className="w-8 h-8" />
                </div>
              ) : isAuthenticated ? (
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-full border border-transparent hover:border-slate-200 transition-all"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="bg-gradient-to-r from-brand-blue to-purple-600 h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-sm uppercase shadow-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                  <FiUser size={22} />
                  <span>Login</span>
                </Link>
              )}

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isAuthenticated && showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-2 text-slate-700 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-bold text-base truncate text-slate-800">{user?.name}</p>
                      <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                    </div>

                    <div className="py-2">
                      <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 text-sm font-medium text-slate-750 transition-colors">
                        <FiUser size={18} className="text-slate-500" /> My Profile
                      </Link>
                      <Link to="/my-orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 text-sm font-medium text-slate-750 transition-colors">
                        <FiShoppingCart size={18} className="text-slate-500" /> My Orders
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-5 py-2.5 hover:bg-red-50 text-red-650 text-sm font-semibold transition-colors"
                      >
                        <FiLogOut size={18} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              ref={hamburgerBtnRef}
              className="lg:hidden text-slate-600 p-2.5 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              ref={mobileSearchRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden px-4 pt-2.5 pb-2 border-t border-slate-100 bg-white relative"
            >
              <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center gap-2" role="search">
                <div className="relative flex-grow">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    role="combobox"
                    aria-expanded={isSearchDropdownOpen}
                    aria-autocomplete="list"
                    aria-controls="mobile-search-suggestions"
                    autoFocus
                    placeholder="Search phones, brands, accessories..."
                    className="w-full py-2 pl-10 pr-9 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-full transition-all"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleInputKeyDown}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setLoadingSuggestions(false);
                        setSuggestionError(null);
                        setActiveIndex(-1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      aria-label="Clear search text"
                    >
                      <FiX size={15} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-brand-blue hover:bg-brand-blueHover text-white px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-colors shadow-sm"
                >
                  Search
                </button>
              </form>

              <SearchDropdown
                isOpen={isSearchDropdownOpen}
                query={searchQuery}
                recentSearches={recentSearches}
                suggestions={suggestions}
                loading={loadingSuggestions}
                error={suggestionError}
                activeIndex={activeIndex}
                onSelectRecent={handleSelectRecent}
                onRemoveRecent={handleRemoveRecent}
                onClearAllRecent={handleClearAllRecent}
                onSelectSuggestion={handleSelectSuggestion}
                onClose={() => setIsSearchDropdownOpen(false)}
                listboxId="mobile-search-suggestions"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
              onClick={closeMenu}
            />

            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-[310px] sm:w-[350px] bg-white z-[70] shadow-2xl flex flex-col lg:hidden border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="AK Mobiles" className="h-10 w-auto object-contain -translate-y-0.5" />
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  aria-label="Close menu"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav aria-label="Main navigation" className="flex-grow overflow-y-auto p-4 space-y-1">
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive('/') ? 'bg-pink-50/70 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Home</span>
                      <FiChevronRight className={isActive('/') ? 'text-brand-blue' : 'text-slate-400'} size={18} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive('/products') && !search ? 'bg-pink-50/70 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Shop</span>
                      <FiChevronRight className={isActive('/products') && !search ? 'text-brand-blue' : 'text-slate-400'} size={18} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive('/about') ? 'bg-pink-50/70 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>About</span>
                      <FiChevronRight className={isActive('/about') ? 'text-brand-blue' : 'text-slate-400'} size={18} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive('/contact') ? 'bg-pink-50/70 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Contact</span>
                      <FiChevronRight className={isActive('/contact') ? 'text-brand-blue' : 'text-slate-400'} size={18} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={isAuthenticated ? '/profile' : '/login'}
                      onClick={closeMenu}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive('/profile') ? 'bg-pink-50/70 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Account</span>
                      <FiChevronRight className={isActive('/profile') ? 'text-brand-blue' : 'text-slate-400'} size={18} />
                    </Link>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
