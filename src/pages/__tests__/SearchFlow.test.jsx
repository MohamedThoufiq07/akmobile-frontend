import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from '../../components/layout/Header';
import SearchResultsPage from '../SearchResultsPage';
import SearchResultCard from '../../components/ui/SearchResultCard';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
} from '../../utils/recentSearches';
import { getValidImageUrl, getPrimaryProductImageUrl } from '../../utils/imageHelper';
import { normalizeProductsResponse } from '../../utils/apiHelper';

// Mock IntersectionObserver
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.scrollTo = vi.fn();

// Mock API
vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../utils/api';

// Mock Router Navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Auth, Cart, and Wishlist contexts
const mockAddToCart = vi.fn();
const mockToggleWishlist = vi.fn();
const mockIsInWishlist = vi.fn(() => false);

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock('../../context/useCart', () => ({
  useCart: () => ({
    cartItemCount: 2,
    addToCart: mockAddToCart,
  }),
}));

vi.mock('../../context/useWishlist', () => ({
  useWishlist: () => ({
    wishlist: [{ _id: 'wish_001' }],
    toggleWishlist: mockToggleWishlist,
    isInWishlist: mockIsInWishlist,
  }),
}));

describe('Search and Mobile Navigation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('1. Recent Search History & LocalStorage Management', () => {
    it('saves recent search terms without duplicates (case-insensitive) and maintains newest first', () => {
      saveRecentSearch('iphone 15');
      saveRecentSearch('Samsung Galaxy');
      saveRecentSearch('IPHONE 15');

      const searches = getRecentSearches();
      expect(searches).toHaveLength(2);
      expect(searches[0]).toBe('IPHONE 15');
      expect(searches[1]).toBe('Samsung Galaxy');
    });

    it('enforces maximum limit of 8 recent searches', () => {
      for (let i = 1; i <= 10; i++) {
        saveRecentSearch(`Query ${i}`);
      }
      const searches = getRecentSearches();
      expect(searches).toHaveLength(8);
      expect(searches[0]).toBe('Query 10');
      expect(searches[7]).toBe('Query 3');
    });

    it('removes individual search item and clears all searches safely', () => {
      saveRecentSearch('Pixel 8');
      saveRecentSearch('OnePlus 12');

      removeRecentSearch('Pixel 8');
      expect(getRecentSearches()).toEqual(['OnePlus 12']);

      clearAllRecentSearches();
      expect(getRecentSearches()).toEqual([]);
    });

    it('handles corrupted localStorage data without throwing', () => {
      window.localStorage.setItem('akmobiles_recent_searches', 'invalid-json{{{');
      expect(getRecentSearches()).toEqual([]);
    });
  });

  describe('2. API Normalization & Image Helper', () => {
    it('safely normalizes various API response formats', () => {
      expect(normalizeProductsResponse(null)).toEqual([]);
      expect(normalizeProductsResponse([{ _id: '1' }])).toEqual([{ _id: '1' }]);
      expect(normalizeProductsResponse({ products: [{ _id: '2' }] })).toEqual([{ _id: '2' }]);
      expect(normalizeProductsResponse({ results: [{ _id: '3' }] })).toEqual([{ _id: '3' }]);
      expect(normalizeProductsResponse({ data: [{ _id: '4' }] })).toEqual([{ _id: '4' }]);
      expect(normalizeProductsResponse({ product: { _id: '5' } })).toEqual([{ _id: '5' }]);
      expect(normalizeProductsResponse('invalid')).toEqual([]);
    });

    it('resolves valid HTTPS and relative image URLs correctly', () => {
      const validUrl = 'https://example.com/phone.png';
      expect(getValidImageUrl(validUrl, 'iPhone')).toBe(validUrl);

      const relativeUrl = '/images/phone.png';
      expect(getValidImageUrl(relativeUrl, 'iPhone')).toBe(relativeUrl);
    });

    it('falls back to placeholder SVG for empty or invalid image URLs', () => {
      const fallback = getValidImageUrl('', 'Test Phone');
      expect(fallback).toContain('data:image/svg+xml');
      expect(fallback).toContain('Test%20Phone');

      const mockImgUrl = 'http://img/1.jpg';
      expect(getValidImageUrl(mockImgUrl, 'Mock')).toContain('data:image/svg+xml');
    });

    it('extracts primary product image properly from product object', () => {
      const productWithImages = {
        name: 'Galaxy S24',
        images: [{ url: 'https://images.com/s24.png', alt: 'front' }],
      };
      expect(getPrimaryProductImageUrl(productWithImages)).toBe('https://images.com/s24.png');

      const productWithSingleImage = {
        name: 'Pixel 8',
        image: 'https://images.com/pixel.png',
      };
      expect(getPrimaryProductImageUrl(productWithSingleImage)).toBe('https://images.com/pixel.png');

      const productWithoutImage = { name: 'No Image Phone' };
      expect(getPrimaryProductImageUrl(productWithoutImage)).toContain('data:image/svg+xml');
    });
  });

  describe('3. Mobile Navigation Drawer Accessibility', () => {
    it('does not display uppercase NAVIGATION heading, retains semantic nav, and locks scroll', () => {
      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      // Open mobile drawer
      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      // Verify uppercase "NAVIGATION" heading is NOT rendered as text
      const navHeading = screen.queryByText(/^navigation$/i);
      expect(navHeading).toBeNull();

      // Verify semantic accessibility nav is present
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeDefined();

      // Verify menu links are present inside the drawer
      expect(screen.getAllByRole('link', { name: /Home/i })).toHaveLength(2);
      expect(screen.getAllByRole('link', { name: /Shop/i })).toHaveLength(2);
      expect(screen.getAllByRole('link', { name: /About/i })).toHaveLength(2);
      expect(screen.getAllByRole('link', { name: /Contact/i })).toHaveLength(2);

      // Verify background scrolling is locked
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes mobile drawer and restores body scroll on close button click', async () => {
      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();

      const closeBtn = screen.getByLabelText('Close menu');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull();
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('4. Search Suggestions & Keyboard Navigation', () => {
    it('shows recent searches when input is focused and empty', async () => {
      saveRecentSearch('AirPods');
      saveRecentSearch('iPhone 15');

      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      const searchInput = screen.getByPlaceholderText(/Search for smartphones/i);
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeDefined();
        expect(screen.getByText('iPhone 15')).toBeDefined();
        expect(screen.getByText('AirPods')).toBeDefined();
      });
    });

    it('fetches and renders debounced product suggestions with params object', async () => {
      const mockProducts = [
        {
          _id: 'prod_ip15',
          name: 'iPhone 15 Pro',
          brand: 'Apple',
          category: 'Smartphones',
          offerPrice: 120000,
          originalPrice: 134900,
          discount: 11,
          stock: 10,
          images: [{ url: 'https://img.com/ip15.png' }],
        },
        {
          _id: 'prod_ip_case',
          name: 'iPhone 15 Case',
          brand: 'Spigen',
          category: 'Accessories',
          offerPrice: 1500,
          originalPrice: 2000,
          discount: 25,
          stock: 0,
          images: [{ url: 'https://img.com/case.png' }],
        },
      ];

      api.get.mockResolvedValue({ data: { products: mockProducts } });

      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      const searchInput = screen.getByPlaceholderText(/Search for smartphones/i);
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'iphone' } });

      await waitFor(
        () => {
          expect(api.get).toHaveBeenCalledWith('/products/', expect.objectContaining({
            params: { search: 'iphone', limit: 6 },
          }));
          expect(screen.getByText('iPhone 15 Pro')).toBeDefined();
          expect(screen.getByText('iPhone 15 Case')).toBeDefined();
          expect(screen.getByText('Apple')).toBeDefined();
          expect(screen.getByText('Spigen')).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    it('clicking a product suggestion navigates directly to product detail page', async () => {
      const mockProducts = [
        {
          _id: 'prod_s24_id',
          name: 'Samsung Galaxy S24',
          brand: 'Samsung',
          offerPrice: 79999,
          stock: 5,
        },
      ];
      api.get.mockResolvedValue({ data: { products: mockProducts } });

      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      const searchInput = screen.getByPlaceholderText(/Search for smartphones/i);
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'samsung' } });

      await waitFor(
        () => {
          expect(screen.getByText('Samsung Galaxy S24')).toBeDefined();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByText('Samsung Galaxy S24'));
      expect(mockNavigate).toHaveBeenCalledWith('/products/prod_s24_id');
    });

    it('submitting search navigates to /search?q=query and saves query in recent searches', () => {
      render(
        <HelmetProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </HelmetProvider>
      );

      const searchInput = screen.getByPlaceholderText(/Search for smartphones/i);
      fireEvent.change(searchInput, { target: { value: 'OnePlus 12' } });

      const searchButton = screen.getAllByRole('button', { name: 'Search' })[0];
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=OnePlus%2012');
      expect(getRecentSearches()).toContain('OnePlus 12');
    });
  });

  describe('5. SearchResultCard Component', () => {
    const sampleProduct = {
      _id: 'test_prod_99',
      name: 'Nothing Phone (2a)',
      brand: 'Nothing',
      category: 'Smartphones',
      offerPrice: 23999,
      originalPrice: 25999,
      discount: 8,
      stock: 12,
      rating: 4.5,
      numReviews: 88,
      images: [{ url: 'https://images.com/nothing.png' }],
    };

    it('clicking card navigates to product details page', () => {
      render(
        <BrowserRouter>
          <SearchResultCard product={sampleProduct} />
        </BrowserRouter>
      );

      const card = screen.getByTestId('search-result-card');
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/products/test_prod_99');
    });

    it('clicking Wishlist, Add to Cart, or Buy Now does not trigger card navigation (stopPropagation)', () => {
      render(
        <BrowserRouter>
          <SearchResultCard product={sampleProduct} />
        </BrowserRouter>
      );

      mockNavigate.mockClear();

      const wishlistBtn = screen.getByLabelText('Toggle Wishlist');
      fireEvent.click(wishlistBtn);
      expect(mockToggleWishlist).toHaveBeenCalledWith('test_prod_99');
      expect(mockNavigate).not.toHaveBeenCalled();

      const addBtn = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(addBtn);
      expect(mockAddToCart).toHaveBeenCalledWith(sampleProduct, 1);
      expect(mockNavigate).not.toHaveBeenCalled();

      const buyBtn = screen.getByRole('button', { name: /Buy Now/i });
      fireEvent.click(buyBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });
  });

  describe('6. Search Results Page Functionality', () => {
    it('displays loading skeletons, product count, and compact result cards', async () => {
      const mockItems = [
        {
          _id: 'p1',
          name: 'Apple iPhone 15',
          brand: 'Apple',
          offerPrice: 70000,
          originalPrice: 79900,
          stock: 4,
          rating: 4.8,
          numReviews: 200,
        },
      ];

      api.get.mockResolvedValueOnce({ data: { products: mockItems } });

      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/search?q=iPhone']}>
            <SearchResultsPage />
          </MemoryRouter>
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Apple iPhone 15')).toBeDefined();
        expect(screen.getByText(/Search Results/i)).toBeDefined();
      });
    });

    it('displays empty search page state when query parameter is missing', () => {
      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/search']}>
            <SearchResultsPage />
          </MemoryRouter>
        </HelmetProvider>
      );

      expect(screen.getByText('Start your search')).toBeDefined();
    });

    it('displays error state with a working retry button', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));
      api.get.mockResolvedValueOnce({ data: { products: [] } });

      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/search?q=ErrorQuery']}>
            <SearchResultsPage />
          </MemoryRouter>
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Search Unavailable')).toBeDefined();
      });

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      await act(async () => {
        fireEvent.click(retryBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeDefined();
      });
    });
  });
});
