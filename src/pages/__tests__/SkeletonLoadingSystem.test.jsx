import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonImage,
  PageSkeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  SearchResultSkeleton,
  ProductDetailSkeleton,
  CartSkeleton,
  CheckoutSkeleton,
  WishlistSkeleton,
  OrderCardSkeleton,
  OrderDetailSkeleton,
  TrackOrderSkeleton,
  ProfileSkeleton,
  TableSkeleton,
  AdminDashboardSkeleton,
  AdminMessagesSkeleton,
  AdminBannersSkeleton,
} from '../../components/ui/skeleton';
import LazyImage from '../../components/ui/LazyImage';
import useDelayedLoading from '../../hooks/useDelayedLoading';

// Mock IntersectionObserver
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.scrollTo = vi.fn();

describe('AK Mobiles — Complete Skeleton Loading System Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------
     1. Skeleton Primitive Variants and Accessibility
  ------------------------------------------------------------- */
  describe('1. Base Skeleton Primitives & Accessibility', () => {
    it('renders base Skeleton with aria-hidden="true" and correct default classes', () => {
      const { container } = render(<Skeleton className="w-24 h-6" />);
      const el = container.querySelector('[aria-hidden="true"]');
      expect(el).not.toBeNull();
      expect(el.className).toContain('animate-pulse');
      expect(el.className).toContain('bg-slate-200');
      expect(el.className).toContain('w-24');
      expect(el.className).toContain('h-6');
    });

    it('renders circular, rounded, and text variants properly', () => {
      const { container: circleBox } = render(<Skeleton variant="circular" className="w-10 h-10" />);
      expect(circleBox.firstChild.className).toContain('rounded-full');

      const { container: roundedBox } = render(<Skeleton variant="rounded" className="w-20 h-8" />);
      expect(roundedBox.firstChild.className).toContain('rounded-xl');

      const { container: textBox } = render(<Skeleton variant="text" className="w-32 h-4" />);
      expect(textBox.firstChild.className).toContain('rounded');
    });

    it('renders SkeletonText with multiple lines and varied widths', () => {
      const { container } = render(<SkeletonText lines={3} className="my-2" />);
      const skeletonLines = container.querySelectorAll('.animate-pulse');
      expect(skeletonLines.length).toBe(3);
      expect(skeletonLines[0].className).toContain('w-full');
      expect(skeletonLines[1].className).toContain('w-4/5');
      expect(skeletonLines[2].className).toContain('w-3/5');
    });

    it('renders SkeletonCircle with custom size and shape', () => {
      const { container } = render(<SkeletonCircle size={64} />);
      const circle = container.querySelector('[aria-hidden="true"]');
      expect(circle.className).toContain('rounded-full');
      expect(circle.style.width).toBe('64px');
      expect(circle.style.height).toBe('64px');
    });

    it('renders SkeletonImage preserving aspect ratio', () => {
      const { container } = render(<SkeletonImage aspectRatio="aspect-[4/3]" />);
      const img = container.querySelector('[aria-hidden="true"]');
      expect(img.className).toContain('aspect-[4/3]');
    });
  });

  /* -------------------------------------------------------------
     2. PageSkeleton Accessible Wrapper
  ------------------------------------------------------------- */
  describe('2. PageSkeleton Accessibility Container', () => {
    it('renders with aria-busy="true" and accessible status role for screen readers', () => {
      render(
        <PageSkeleton label="Loading product catalog">
          <div data-testid="skeleton-child">Placeholder Content</div>
        </PageSkeleton>
      );

      const busyContainer = screen.getByRole('status');
      expect(busyContainer).not.toBeNull();
      expect(busyContainer.textContent).toContain('Loading product catalog');
      expect(screen.getByTestId('skeleton-child')).not.toBeNull();

      const mainWrapper = busyContainer.parentElement;
      expect(mainWrapper.getAttribute('aria-busy')).toBe('true');
    });
  });

  /* -------------------------------------------------------------
     3. useDelayedLoading Hook (Flicker Prevention)
  ------------------------------------------------------------- */
  describe('3. useDelayedLoading Hook', () => {
    it('returns false initially if delay is configured, then switches after timer', () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(
        ({ loading }) => useDelayedLoading(loading, 150),
        { initialProps: { loading: true } }
      );

      // Initially false during the delay window
      expect(result.current).toBe(false);

      // Advance clock past delay
      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(result.current).toBe(true);

      // Finish loading
      rerender({ loading: false });
      expect(result.current).toBe(false);

      vi.useRealTimers();
    });

    it('safely cleans up timeout on unmount without throwing errors', () => {
      vi.useFakeTimers();
      const { unmount } = renderHook(() => useDelayedLoading(true, 200));
      expect(() => unmount()).not.toThrow();
      vi.useRealTimers();
    });
  });

  /* -------------------------------------------------------------
     4. LazyImage Component with Skeleton & Fallbacks
  ------------------------------------------------------------- */
  describe('4. LazyImage Component', () => {
    it('shows skeleton until image loads successfully', () => {
      const { container } = render(
        <LazyImage
          src="https://images.unsplash.com/photo-phone.jpg"
          alt="Test Smartphone"
          className="w-full h-full object-cover"
        />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).not.toBeNull();

      const img = screen.getByAltText('Test Smartphone');
      expect(img.className).toContain('opacity-0');

      // Trigger onLoad
      fireEvent.load(img);

      // Image becomes visible
      expect(img.className).toContain('opacity-100');
    });

    it('handles image error gracefully by displaying fallback SVG without broken icons', () => {
      render(
        <LazyImage
          src="https://invalid-domain.com/broken.jpg"
          alt="Broken Image"
          fallbackText="Broken Image"
        />
      );

      const img = screen.getByAltText('Broken Image');
      fireEvent.error(img);

      expect(img.src).toContain('data:image/svg+xml');
      expect(img.src).toContain('Broken');
    });
  });

  /* -------------------------------------------------------------
     5. Storefront Product Skeletons (Cards & Grids)
  ------------------------------------------------------------- */
  describe('5. Storefront Product Skeletons', () => {
    it('renders ProductCardSkeleton matching ProductCard dimensions and badges', () => {
      const { container } = render(<ProductCardSkeleton />);
      const card = container.firstChild;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('rounded-2xl');

      // Should have image placeholder, text rows, price, button
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it('renders ProductGridSkeleton with custom count matching grid columns', () => {
      const { container } = render(<ProductGridSkeleton count={8} />);
      const grid = container.firstChild;
      expect(grid.className).toContain('grid');
      expect(grid.className).toContain('grid-cols-2');
      expect(grid.children.length).toBe(8);
    });

    it('renders SearchResultSkeleton with responsive mobile horizontal & desktop layout', () => {
      const { container } = render(<SearchResultSkeleton count={3} />);
      const items = container.querySelectorAll('[aria-hidden="true"]');
      expect(items.length).toBeGreaterThanOrEqual(3);
    });

    it('renders ProductDetailSkeleton matching vertical/horizontal gallery and buy section', () => {
      const { container } = render(<ProductDetailSkeleton />);
      expect(container.querySelector('.grid')).not.toBeNull();
      // Should have thumbnails placeholder + main preview placeholder
      const placeholders = container.querySelectorAll('[aria-hidden="true"]');
      expect(placeholders.length).toBeGreaterThanOrEqual(10);
    });
  });

  /* -------------------------------------------------------------
     6. Storefront Flow Skeletons (Cart, Checkout, Wishlist, Orders, Profile)
  ------------------------------------------------------------- */
  describe('6. Storefront Flow Skeletons', () => {
    it('renders CartSkeleton matching cart items and summary card', () => {
      const { container } = render(<CartSkeleton />);
      expect(container.querySelector('.lg\\:w-2\\/3')).not.toBeNull();
      expect(container.querySelector('.lg\\:w-1\\/3')).not.toBeNull();
    });

    it('renders CheckoutSkeleton matching shipping form and order breakdown card', () => {
      const { container } = render(<CheckoutSkeleton />);
      expect(container.firstChild.className).toContain('container');
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(10);
    });

    it('renders WishlistSkeleton matching product cards grid', () => {
      const { container } = render(<WishlistSkeleton count={4} />);
      expect(container.querySelectorAll('.rounded-2xl').length).toBe(4);
    });

    it('renders OrderCardSkeleton and OrderDetailSkeleton matching timeline and specs', () => {
      const { container: orderCardBox } = render(
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      );
      expect(orderCardBox.querySelectorAll('.rounded-2xl').length).toBe(2);

      const { container: orderDetailBox } = render(<OrderDetailSkeleton />);
      expect(orderDetailBox.querySelector('.grid')).not.toBeNull();
    });

    it('renders TrackOrderSkeleton and ProfileSkeleton matching account tabs', () => {
      const { container: trackBox } = render(<TrackOrderSkeleton />);
      expect(trackBox.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(6);

      const { container: profileBox } = render(<ProfileSkeleton />);
      expect(profileBox.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(8);
    });
  });

  /* -------------------------------------------------------------
     7. Admin Panel Skeletons (Tables, Dashboard, Messages, Banners)
  ------------------------------------------------------------- */
  describe('7. Admin Panel Skeletons', () => {
    it('renders TableSkeleton with specified rows and cols', () => {
      const { container } = render(<TableSkeleton rows={5} cols={6} />);
      const table = container.querySelector('table');
      expect(table).not.toBeNull();
      const ths = container.querySelectorAll('th');
      expect(ths.length).toBe(6);
      const trs = container.querySelectorAll('tbody tr');
      expect(trs.length).toBe(5);
    });

    it('renders AdminDashboardSkeleton with metric cards, chart, and recent orders placeholders', () => {
      const { container } = render(<AdminDashboardSkeleton />);
      const statCards = container.querySelectorAll('.grid > div');
      expect(statCards.length).toBeGreaterThanOrEqual(4);
    });

    it('renders AdminMessagesSkeleton with cards stack matching contact submissions', () => {
      const { container } = render(<AdminMessagesSkeleton count={4} />);
      const cards = container.firstChild.children;
      expect(cards.length).toBe(4);
    });

    it('renders AdminBannersSkeleton with hero banners grid placeholders', () => {
      const { container } = render(<AdminBannersSkeleton count={4} />);
      expect(container.querySelectorAll('.aspect-\\[21\\/9\\]').length).toBe(4);
    });
  });

  /* -------------------------------------------------------------
     8. Screen State Lifecycle & Content Preservation
  ------------------------------------------------------------- */
  describe('8. State Transitions & Content Preservation', () => {
    it('preserves existing content during background updates rather than flashing skeletons', () => {
      const TestContainer = ({ isInitialLoading, isBackgroundRefreshing, items }) => {
        if (isInitialLoading) {
          return (
            <PageSkeleton label="Initial Load">
              <div data-testid="initial-skeleton">Loading items...</div>
            </PageSkeleton>
          );
        }

        return (
          <div>
            {isBackgroundRefreshing && <span data-testid="refresh-indicator">Updating...</span>}
            <ul data-testid="items-list">
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        );
      };

      // Initial loading state shows skeleton
      const { rerender } = render(
        <TestContainer isInitialLoading={true} isBackgroundRefreshing={false} items={[]} />
      );
      expect(screen.getByTestId('initial-skeleton')).not.toBeNull();
      expect(screen.queryByTestId('items-list')).toBeNull();

      // Loaded state shows data
      rerender(
        <TestContainer isInitialLoading={false} isBackgroundRefreshing={false} items={['Phone A', 'Phone B']} />
      );
      expect(screen.queryByTestId('initial-skeleton')).toBeNull();
      expect(screen.getByTestId('items-list')).not.toBeNull();
      expect(screen.getByText('Phone A')).not.toBeNull();

      // Background refreshing keeps existing content visible without jumping back to PageSkeleton
      rerender(
        <TestContainer isInitialLoading={false} isBackgroundRefreshing={true} items={['Phone A', 'Phone B']} />
      );
      expect(screen.queryByTestId('initial-skeleton')).toBeNull();
      expect(screen.getByTestId('items-list')).not.toBeNull();
      expect(screen.getByTestId('refresh-indicator')).not.toBeNull();
      expect(screen.getByText('Phone A')).not.toBeNull();
    });
  });
});
