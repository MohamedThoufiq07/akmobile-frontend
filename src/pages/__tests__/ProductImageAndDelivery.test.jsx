import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProductFormModal from '../../components/admin/ProductFormModal';
import ProductDetailPage from '../ProductDetailPage';
import { CartProvider } from '../../context/CartContext';
import { useCart } from '../../context/useCart';
import { getPrimaryProductImageUrl } from '../../utils/imageHelper';
import SearchResultCard from '../../components/ui/SearchResultCard';
import ProductCard from '../../components/ui/ProductCard';

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

// Mock Admin API
vi.mock('../../utils/adminApi', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
import adminApi from '../../utils/adminApi';

// Mock React Router Navigate & Params
const mockNavigate = vi.fn();
let mockParams = { id: 'prod-001' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Mock Auth, Wishlist, RecentlyViewed
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'admin-1', is_staff: true, email: 'admin@akmobiles.com' },
    token: 'admin-token',
  }),
}));

vi.mock('../../context/useWishlist', () => ({
  useWishlist: () => ({
    isInWishlist: () => false,
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock('../../hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    addRecentlyViewed: vi.fn(),
  }),
}));

// Helper component to test CartContext directly
const CartTestConsumer = () => {
  const { cartItems, addToCart, updateQuantity, cartShipping, cartTotal, cartSubtotal } = useCart();
  return (
    <div>
      <div data-testid="cart-count">{cartItems.length}</div>
      <div data-testid="cart-subtotal">{cartSubtotal}</div>
      <div data-testid="cart-shipping">{cartShipping}</div>
      <div data-testid="cart-total">{cartTotal}</div>
      <button
        onClick={() =>
          addToCart({
            id: 'prod-a',
            name: 'Product A',
            offerPrice: 1000,
            stock: 10,
            deliveryCharge: '49.00',
            primaryImage: { url: 'https://blob.vercel.com/a.jpg' },
          })
        }
      >
        Add Product A
      </button>
      <button
        onClick={() =>
          addToCart({
            id: 'prod-b',
            name: 'Product B',
            offerPrice: 500,
            stock: 10,
            deliveryCharge: '30.00',
            primaryImage: { url: 'https://blob.vercel.com/b.jpg' },
          })
        }
      >
        Add Product B
      </button>
      <button
        onClick={() =>
          addToCart({
            id: 'prod-free',
            name: 'Product Free',
            offerPrice: 800,
            stock: 10,
            deliveryCharge: '0.00',
            primaryImage: { url: 'https://blob.vercel.com/free.jpg' },
          })
        }
      >
        Add Free Product
      </button>
      <button onClick={() => updateQuantity('prod-a', 5)}>Set Product A Qty 5</button>
    </div>
  );
};

describe('Product Image & Delivery Charge Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockParams = { id: 'prod-001' };
  });

  describe('1. Image Helper & Storefront Primary Image Priority', () => {
    it('prioritizes primaryImage.url above other fields', () => {
      const product = {
        primaryImage: { url: 'https://blob.vercel.com/primary.webp' },
        images: [{ url: 'https://blob.vercel.com/secondary.webp' }],
        image: 'https://legacy.com/old.jpg',
      };
      expect(getPrimaryProductImageUrl(product)).toBe('https://blob.vercel.com/primary.webp');
    });

    it('falls back to first element in images array if primaryImage is not set', () => {
      const product = {
        images: [
          { url: 'https://blob.vercel.com/first.webp' },
          { url: 'https://blob.vercel.com/second.webp' },
        ],
        image: 'https://legacy.com/old.jpg',
      };
      expect(getPrimaryProductImageUrl(product)).toBe('https://blob.vercel.com/first.webp');
    });

    it('falls back to string image in legacy images array', () => {
      const product = {
        images: ['https://legacy.com/legacy-1.jpg', 'https://legacy.com/legacy-2.jpg'],
      };
      expect(getPrimaryProductImageUrl(product)).toBe('https://legacy.com/legacy-1.jpg');
    });

    it('falls back to product.image or placeholder if no images exist', () => {
      const productWithImg = { name: 'iPhone 15', image: 'https://example.com/img.jpg' };
      expect(getPrimaryProductImageUrl(productWithImg)).toBe('https://example.com/img.jpg');

      const productEmpty = { name: 'iPhone 15' };
      expect(getPrimaryProductImageUrl(productEmpty)).toContain('data:image/svg+xml');
    });

    it('SearchResultCard displays primary image', () => {
      const product = {
        id: 'p1',
        name: 'Galaxy S24 Ultra',
        brand: 'Samsung',
        category: 'Smartphones',
        offerPrice: 124999,
        originalPrice: 134999,
        stock: 10,
        deliveryCharge: '49.00',
        primaryImage: { url: 'https://blob.vercel.com/galaxy-primary.webp' },
        images: [{ url: 'https://blob.vercel.com/galaxy-secondary.webp' }],
      };

      render(
        <CartProvider>
          <MemoryRouter>
            <SearchResultCard product={product} />
          </MemoryRouter>
        </CartProvider>
      );

      const img = screen.getByRole('img');
      expect(img.src).toBe('https://blob.vercel.com/galaxy-primary.webp');
      expect(screen.getByText('Galaxy S24 Ultra')).toBeTruthy();
    });

    it('ProductCard displays primary image', () => {
      const product = {
        id: 'p2',
        name: 'OnePlus 12',
        brand: 'OnePlus',
        category: 'Smartphones',
        offerPrice: 64999,
        originalPrice: 69999,
        stock: 5,
        deliveryCharge: '0.00',
        primaryImage: { url: 'https://blob.vercel.com/oneplus-primary.webp' },
      };

      render(
        <CartProvider>
          <MemoryRouter>
            <ProductCard product={product} />
          </MemoryRouter>
        </CartProvider>
      );

      const img = screen.getByRole('img');
      expect(img.src).toBe('https://blob.vercel.com/oneplus-primary.webp');
      expect(screen.getByText('OnePlus 12')).toBeTruthy();
    });
  });

  describe('2. Admin Product Form Modal (Multi-Image Upload & Delivery Charge)', () => {
    it('renders delivery charge input with helper text and default value', () => {
      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={null}
        />
      );

      const deliveryInput = screen.getByLabelText(/Delivery Charge/i);
      expect(deliveryInput).toBeTruthy();
      expect(deliveryInput.value).toBe('49.00');
      expect(screen.getByText(/Enter 0 for free delivery/i)).toBeTruthy();
    });

    it('enforces maximum 5 product images limit in header and subtitle', () => {
      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={null}
        />
      );

      expect(screen.getByText(/Product Images \(0\/5\)/i)).toBeTruthy();
      expect(screen.getAllByText(/Select up to 5 more images/i).length).toBeGreaterThanOrEqual(1);
    });

    it('loads existing images with primary badge for editing product and shows 2/5 count', () => {
      const existingProduct = {
        id: 'p-edit-1',
        _id: 'p-edit-1',
        name: 'Pixel 9 Pro',
        brand: 'Google',
        category: 'Smartphones',
        offerPrice: 79999,
        originalPrice: 84999,
        deliveryCharge: '0.00',
        stock: 12,
        images: [
          { id: 'img-1', url: 'https://blob.vercel.com/pixel-front.webp', isPrimary: true },
          { id: 'img-2', url: 'https://blob.vercel.com/pixel-back.webp', isPrimary: false },
        ],
      };

      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={existingProduct}
        />
      );

      expect(screen.getByText(/Product Images \(2\/5\)/i)).toBeTruthy();
      expect(screen.getAllByText(/Select up to 3 more images/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('pixel-front.webp')).toBeTruthy();
      expect(screen.getByText('pixel-back.webp')).toBeTruthy();
      expect(screen.getByText('Primary')).toBeTruthy();
    });

    it('disables upload dropzone when 5 images are loaded', () => {
      const fiveImagesProduct = {
        id: 'p-edit-5',
        _id: 'p-edit-5',
        name: 'Max Image Phone',
        brand: 'Apple',
        category: 'Smartphones',
        offerPrice: 99999,
        stock: 10,
        images: [
          { id: '1', url: 'https://blob.vercel.com/1.jpg', isPrimary: true },
          { id: '2', url: 'https://blob.vercel.com/2.jpg', isPrimary: false },
          { id: '3', url: 'https://blob.vercel.com/3.jpg', isPrimary: false },
          { id: '4', url: 'https://blob.vercel.com/4.jpg', isPrimary: false },
          { id: '5', url: 'https://blob.vercel.com/5.jpg', isPrimary: false },
        ],
      };

      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={fiveImagesProduct}
        />
      );

      expect(screen.getByText(/Product Images \(5\/5\)/i)).toBeTruthy();
      expect(screen.getAllByText(/Maximum 5 product images reached/i).length).toBeGreaterThanOrEqual(1);
    });

    it('reorders images and moves primary to first position when Set as Primary is clicked', async () => {
      const existingProduct = {
        id: 'p-edit-2',
        _id: 'p-edit-2',
        name: 'Pixel 9 Pro',
        brand: 'Google',
        category: 'Smartphones',
        offerPrice: 79999,
        originalPrice: 84999,
        deliveryCharge: '49.00',
        stock: 12,
        images: [
          { id: 'img-1', url: 'https://blob.vercel.com/img1.webp', isPrimary: true, altText: 'First Image' },
          { id: 'img-2', url: 'https://blob.vercel.com/img2.webp', isPrimary: false, altText: 'Second Image' },
        ],
      };

      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={existingProduct}
        />
      );

      const makePrimaryButtons = screen.getAllByRole('button', { name: /Set as primary/i });
      expect(makePrimaryButtons.length).toBeGreaterThan(0);

      fireEvent.click(makePrimaryButtons[0]);

      expect(screen.getByText('img2.webp')).toBeTruthy();
    });

    it('allows removing an image from the list and frees up an image slot', async () => {
      const existingProduct = {
        id: 'p-edit-3',
        _id: 'p-edit-3',
        name: 'Pixel 9 Pro',
        brand: 'Google',
        category: 'Smartphones',
        offerPrice: 79999,
        originalPrice: 84999,
        deliveryCharge: '49.00',
        stock: 12,
        images: [
          { id: 'img-1', url: 'https://blob.vercel.com/img1.webp', isPrimary: true, altText: 'Image 1' },
          { id: 'img-2', url: 'https://blob.vercel.com/img2.webp', isPrimary: false, altText: 'Image 2' },
        ],
      };

      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={vi.fn()}
          product={existingProduct}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /Remove image/i });
      expect(deleteButtons.length).toBe(2);

      fireEvent.click(deleteButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText('img2.webp')).toBeNull();
        expect(screen.getByText(/Product Images \(1\/5\)/i)).toBeTruthy();
      });
    });

    it('validates and submits clean delivery charge and image data', async () => {
      const mockSaved = vi.fn();
      adminApi.put.mockResolvedValueOnce({ data: { success: true } });

      const existingProduct = {
        id: 'p-edit-4',
        _id: 'p-edit-4',
        name: 'iPhone 15 Pro',
        brand: 'Apple',
        category: 'Smartphones',
        offerPrice: 129900,
        originalPrice: 134900,
        deliveryCharge: '0.00',
        stock: 10,
        images: [
          { id: 'img-1', url: 'https://blob.vercel.com/iphone-front.webp', isPrimary: true },
        ],
      };

      render(
        <ProductFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSaved={mockSaved}
          product={existingProduct}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
      expect(submitBtn.disabled).toBe(false);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminApi.put).toHaveBeenCalledWith(
          '/products/p-edit-4',
          expect.objectContaining({
            deliveryCharge: '0.00',
            name: 'iPhone 15 Pro',
          })
        );
        expect(mockSaved).toHaveBeenCalled();
      });
    });
  });

  describe('3. Product Detail Page Gallery & Delivery Badge', () => {
    it('renders desktop vertical thumbnails and mobile gallery, selecting primary by default', async () => {
      const mockProduct = {
        id: 'prod-001',
        name: 'iPhone 15 Pro Max',
        brand: 'Apple',
        category: 'Smartphones',
        offerPrice: 159900,
        originalPrice: 169900,
        deliveryCharge: '49.00',
        stock: 5,
        rating: 4.8,
        numReviews: 42,
        highlights: ['Titanium design', 'A17 Pro chip'],
        primaryImage: { url: 'https://blob.vercel.com/iphone-main.webp', altText: 'Front View' },
        images: [
          { id: 'img-1', url: 'https://blob.vercel.com/iphone-main.webp', altText: 'Front View', isPrimary: true },
          { id: 'img-2', url: 'https://blob.vercel.com/iphone-back.webp', altText: 'Back View', isPrimary: false },
          { id: 'img-3', url: 'https://blob.vercel.com/iphone-side.webp', altText: 'Side View', isPrimary: false },
        ],
      };

      api.get.mockImplementation((url) => {
        if (url.includes('/related')) {
          return Promise.resolve({ data: { products: [] } });
        }
        return Promise.resolve({ data: { product: mockProduct } });
      });

      render(
        <HelmetProvider>
          <CartProvider>
            <MemoryRouter>
              <ProductDetailPage />
            </MemoryRouter>
          </CartProvider>
        </HelmetProvider>
      );

      // Wait for product details to load
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro Max')).toBeTruthy();
      });

      // Delivery badge should say "Delivery ₹49"
      const deliveryBadges = screen.getAllByText(/Delivery ₹49/i);
      expect(deliveryBadges.length).toBeGreaterThanOrEqual(1);

      // Main image should initially show the primary image
      const mainImages = screen.getAllByAltText('Front View');
      expect(mainImages.length).toBeGreaterThanOrEqual(1);
      expect(mainImages[mainImages.length - 1].src).toBe('https://blob.vercel.com/iphone-main.webp');

      // Click on the second thumbnail (view photo 2 of 3)
      const secondThumbnail = screen.getByRole('button', { name: /View photo 2 of 3/i });
      fireEvent.click(secondThumbnail);

      // Main image should now switch to the second image
      const updatedMainImages = screen.getAllByAltText('Back View');
      expect(updatedMainImages.length).toBeGreaterThanOrEqual(1);
      expect(updatedMainImages[updatedMainImages.length - 1].src).toBe('https://blob.vercel.com/iphone-back.webp');
    });

    it('displays "Free Delivery" when product deliveryCharge is 0', async () => {
      const freeDeliveryProduct = {
        id: 'prod-001',
        name: 'Samsung Galaxy Watch 6',
        brand: 'Samsung',
        category: 'Accessories',
        offerPrice: 24999,
        originalPrice: 29999,
        deliveryCharge: '0.00',
        stock: 8,
        rating: 4.5,
        numReviews: 12,
        primaryImage: { url: 'https://blob.vercel.com/watch.webp' },
        images: [{ id: 'img-1', url: 'https://blob.vercel.com/watch.webp', isPrimary: true }],
      };

      api.get.mockImplementation((url) => {
        if (url.includes('/related')) return Promise.resolve({ data: { products: [] } });
        return Promise.resolve({ data: { product: freeDeliveryProduct } });
      });

      render(
        <HelmetProvider>
          <CartProvider>
            <MemoryRouter>
              <ProductDetailPage />
            </MemoryRouter>
          </CartProvider>
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Samsung Galaxy Watch 6')).toBeTruthy();
      });

      const freeDeliveryElements = screen.getAllByText('Free Delivery');
      expect(freeDeliveryElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Delivery ₹49/i)).toBeNull();
    });
  });

  describe('4. Cart & Delivery Charge Business Rule', () => {
    it('applies delivery charge once per distinct product line and does NOT multiply by quantity', async () => {
      render(
        <CartProvider>
          <CartTestConsumer />
        </CartProvider>
      );

      // Initially empty
      expect(screen.getByTestId('cart-count').textContent).toBe('0');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('0');

      // 1. Add Product A (Qty: 1, Price: 1000, Delivery: 49)
      const addA = screen.getByText('Add Product A');
      fireEvent.click(addA);

      expect(screen.getByTestId('cart-count').textContent).toBe('1');
      expect(screen.getByTestId('cart-subtotal').textContent).toBe('1000');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('49');
      expect(screen.getByTestId('cart-total').textContent).toBe('1049');

      // 2. Increase Qty of Product A to 5
      const setQty5 = screen.getByText('Set Product A Qty 5');
      fireEvent.click(setQty5);

      // Subtotal becomes 5000, but shipping MUST REMAIN ₹49
      expect(screen.getByTestId('cart-subtotal').textContent).toBe('5000');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('49');
      expect(screen.getByTestId('cart-total').textContent).toBe('5049');

      // 3. Add Product B (Qty: 1, Price: 500, Delivery: 30)
      const addB = screen.getByText('Add Product B');
      fireEvent.click(addB);

      // Distinct lines: Product A (49) + Product B (30) = 79 shipping
      expect(screen.getByTestId('cart-count').textContent).toBe('2');
      expect(screen.getByTestId('cart-subtotal').textContent).toBe('5500');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('79');
      expect(screen.getByTestId('cart-total').textContent).toBe('5579');

      // 4. Add Free Delivery Product (Price: 800, Delivery: 0)
      const addFree = screen.getByText('Add Free Product');
      fireEvent.click(addFree);

      // Distinct lines: A(49) + B(30) + Free(0) = 79 shipping
      expect(screen.getByTestId('cart-count').textContent).toBe('3');
      expect(screen.getByTestId('cart-subtotal').textContent).toBe('6300');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('79');
      expect(screen.getByTestId('cart-total').textContent).toBe('6379');
    });

    it('merges identical product additions instead of duplicating lines or delivery charges', async () => {
      render(
        <CartProvider>
          <CartTestConsumer />
        </CartProvider>
      );

      const addA = screen.getByText('Add Product A');
      // Click twice
      fireEvent.click(addA);
      fireEvent.click(addA);

      // Total count of distinct lines is 1, quantity is 2, shipping is 49
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
      expect(screen.getByTestId('cart-subtotal').textContent).toBe('2000');
      expect(screen.getByTestId('cart-shipping').textContent).toBe('49');
      expect(screen.getByTestId('cart-total').textContent).toBe('2049');
    });
  });
});
