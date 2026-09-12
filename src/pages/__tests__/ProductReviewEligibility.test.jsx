import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetailPage from '../ProductDetailPage';
import api from '../../utils/api';
import { GlobalNotificationProvider } from '../../context/GlobalNotificationProvider';

// Mock IntersectionObserver
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('../../utils/api');

const mockUser = {
  _id: 'user-123',
  name: 'Mohammed Ali',
  email: 'mohammed@example.com',
  role: 'customer',
};

let mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  loading: false,
};

vi.mock('../../context/useAuth', () => ({
  useAuth: () => mockAuthContext,
  default: () => mockAuthContext,
}));

vi.mock('../../context/useCart', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    cartItems: [],
  }),
}));

vi.mock('../../context/useWishlist', () => ({
  useWishlist: () => ({
    toggleWishlist: vi.fn(),
    isInWishlist: () => false,
  }),
}));

vi.mock('../../hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    addRecentlyViewed: vi.fn(),
  }),
}));

const mockProduct = {
  _id: 'prod-pixel-8',
  name: 'Google Pixel 8',
  brand: 'Google',
  category: 'Smartphones',
  description: 'Flagship Google Phone with Tensor G3.',
  highlights: ['Tensor G3', 'OLED 120Hz', '50MP Camera'],
  specifications: { Display: '6.2 inch OLED', Storage: '128GB' },
  originalPrice: 75999,
  offerPrice: 69999,
  deliveryCharge: '0.00',
  stock: 10,
  rating: 4.8,
  numReviews: 2,
  primaryImage: { url: 'https://blob.vercel-storage.com/pixel8.jpg' },
  images: [{ url: 'https://blob.vercel-storage.com/pixel8.jpg' }],
};

const mockReviewsResponse = {
  success: true,
  summary: {
    averageRating: 4.8,
    reviewCount: 2,
    distribution: { 5: 2, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  results: [
    {
      _id: 'rev-1',
      name: 'Mohammed Ali',
      avatarInitial: 'M',
      rating: 5,
      title: 'Amazing Display & Camera',
      comment: 'Super fast phone, love the camera features.',
      isVerifiedPurchase: true,
      createdAt: '2026-09-10T10:00:00Z',
      canEdit: true,
    },
    {
      _id: 'rev-2',
      name: 'Sarah Khan',
      avatarInitial: 'S',
      rating: 5,
      title: 'Smooth UI',
      comment: 'Clean Android experience.',
      isVerifiedPurchase: false,
      createdAt: '2026-09-09T14:00:00Z',
      canEdit: false,
    },
  ],
};

describe('Verified Purchase Product Review System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
    };

    api.get.mockImplementation((url) => {
      if (url === '/products/prod-pixel-8') {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url === '/products/prod-pixel-8/related') {
        return Promise.resolve({ data: { success: true, products: [] } });
      }
      if (url === '/products/prod-pixel-8/reviews') {
        return Promise.resolve({ data: mockReviewsResponse });
      }
      if (url === '/products/prod-pixel-8/reviews/eligibility') {
        return Promise.resolve({
          data: {
            canReview: true,
            reason: 'ELIGIBLE',
            isVerifiedPurchase: true,
            existingReviewId: null,
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    api.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Review submitted successfully.',
        review: {
          _id: 'rev-new',
          name: 'Mohammed Ali',
          avatarInitial: 'M',
          rating: 5,
          title: 'New review',
          comment: 'Great phone!',
          isVerifiedPurchase: true,
          createdAt: new Date().toISOString(),
          canEdit: true,
        },
      },
    });

    api.put.mockResolvedValue({
      data: {
        success: true,
        message: 'Review updated successfully.',
      },
    });
  });

  const renderComponent = (initialEntries = ['/products/prod-pixel-8#reviews']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <GlobalNotificationProvider>
          <Routes>
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<div>Mock Login Page</div>} />
          </Routes>
        </GlobalNotificationProvider>
      </MemoryRouter>
    );
  };

  it('renders reviews, star distribution, and verified purchase badge based on backend data', async () => {
    renderComponent();

    // Verify Tab is loaded
    expect(await screen.findByRole('heading', { name: 'Customer Reviews' })).toBeTruthy();
    expect(screen.getByText('Amazing Display & Camera')).toBeTruthy();
    expect(screen.getByText('Super fast phone, love the camera features.')).toBeTruthy();

    // Check Verified Purchase badge for rev-1 (true)
    const verifiedBadges = screen.getAllByText(/Verified Purchase/i);
    expect(verifiedBadges.length).toBeGreaterThanOrEqual(1);

    // Check edit button on user's own review
    expect(screen.getByRole('button', { name: 'Edit review' })).toBeTruthy();
  });

  it('shows write review button and opens review form modal for eligible user', async () => {
    renderComponent();

    const writeBtn = await screen.findByRole('button', { name: 'Write a Review' });
    expect(writeBtn).toBeTruthy();

    fireEvent.click(writeBtn);

    // Review Modal opens
    expect(await screen.findByRole('heading', { name: 'Write a Verified Review' })).toBeTruthy();
    expect(screen.getByText('Overall Rating')).toBeTruthy();
    expect(screen.getByLabelText('5 out of 5 stars')).toBeTruthy();
  });

  it('validates form inputs and submits review with valid payload', async () => {
    renderComponent();

    const writeBtn = await screen.findByRole('button', { name: 'Write a Review' });
    fireEvent.click(writeBtn);

    // Try submit empty
    const submitBtn = await screen.findByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    // Expect inline validation
    expect(await screen.findByText('Please select a star rating (1 to 5 stars).')).toBeTruthy();

    // Fill valid data
    fireEvent.click(screen.getByLabelText('5 out of 5 stars'));
    fireEvent.change(screen.getByLabelText(/Your Review/i), {
      target: { value: 'Delivered quickly, excellent product overall!' },
    });
    fireEvent.change(screen.getByLabelText(/Review Headline/i), {
      target: { value: 'Top notch!' },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/products/prod-pixel-8/reviews',
        expect.objectContaining({
          rating: 5,
          title: 'Top notch!',
          comment: 'Delivered quickly, excellent product overall!',
        })
      );
    });
  });

  it('handles non-purchaser and shows purchase required notification', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reviews/eligibility')) {
        return Promise.resolve({
          data: {
            canReview: false,
            reason: 'PURCHASE_REQUIRED',
            isVerifiedPurchase: false,
            existingReviewId: null,
          },
        });
      }
      if (url === '/products/prod-pixel-8') {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url === '/products/prod-pixel-8/reviews') {
        return Promise.resolve({ data: mockReviewsResponse });
      }
      if (url === '/products/prod-pixel-8/related') {
        return Promise.resolve({ data: { success: true, products: [] } });
      }
      return Promise.reject(new Error('not found'));
    });

    renderComponent();

    const writeBtn = await screen.findByRole('button', { name: 'Write a Review' });
    fireEvent.click(writeBtn);

    // Centered notification appears
    expect(
      await screen.findByText('Only customers who purchased this product can review it.')
    ).toBeTruthy();
    // Modal should NOT open
    expect(screen.queryByRole('heading', { name: 'Write a Verified Review' })).toBeNull();
  });

  it('handles undelivered order and shows delivery required notification', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reviews/eligibility')) {
        return Promise.resolve({
          data: {
            canReview: false,
            reason: 'ORDER_NOT_DELIVERED',
            isVerifiedPurchase: false,
            existingReviewId: null,
          },
        });
      }
      if (url === '/products/prod-pixel-8') {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url === '/products/prod-pixel-8/reviews') {
        return Promise.resolve({ data: mockReviewsResponse });
      }
      if (url === '/products/prod-pixel-8/related') {
        return Promise.resolve({ data: { success: true, products: [] } });
      }
      return Promise.reject(new Error('not found'));
    });

    renderComponent();

    const writeBtn = await screen.findByRole('button', { name: 'Write a Review' });
    fireEvent.click(writeBtn);

    expect(
      await screen.findByText('You can review this product after it has been delivered.')
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Write a Verified Review' })).toBeNull();
  });

  it('redirects logged out user to login with return url', async () => {
    mockAuthContext = {
      user: null,
      isAuthenticated: false,
      loading: false,
    };

    renderComponent();

    const writeBtn = await screen.findByRole('button', { name: 'Write a Review' });
    fireEvent.click(writeBtn);

    expect(await screen.findByText('Please sign in to write a review.')).toBeTruthy();
    expect(await screen.findByText('Mock Login Page')).toBeTruthy();
  });

  it('shows Edit Your Review button when user already reviewed', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/reviews/eligibility')) {
        return Promise.resolve({
          data: {
            canReview: false,
            reason: 'REVIEW_ALREADY_EXISTS',
            isVerifiedPurchase: true,
            existingReviewId: 'rev-1',
            existingReview: mockReviewsResponse.results[0],
          },
        });
      }
      if (url === '/products/prod-pixel-8') {
        return Promise.resolve({ data: { success: true, product: mockProduct } });
      }
      if (url === '/products/prod-pixel-8/reviews') {
        return Promise.resolve({ data: mockReviewsResponse });
      }
      if (url === '/products/prod-pixel-8/related') {
        return Promise.resolve({ data: { success: true, products: [] } });
      }
      return Promise.reject(new Error('not found'));
    });

    renderComponent();

    const editBtn = await screen.findByRole('button', { name: 'Edit Your Review' });
    expect(editBtn).toBeTruthy();

    fireEvent.click(editBtn);

    // Edit modal opens with prefilled data
    expect(await screen.findByRole('heading', { name: 'Edit Your Review' })).toBeTruthy();
    expect(await screen.findByDisplayValue('Amazing Display & Camera')).toBeTruthy();
    expect(await screen.findByDisplayValue('Super fast phone, love the camera features.')).toBeTruthy();
  });
});
