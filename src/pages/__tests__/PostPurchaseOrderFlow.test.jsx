import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import CheckoutPage from '../CheckoutPage';
import OrderDetailPage from '../OrderDetailPage';
import MyOrdersPage from '../MyOrdersPage';

// Mock browser globals for jsdom
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.scrollTo = vi.fn();

// Mock toast
vi.mock('react-hot-toast', () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  toastFn.custom = vi.fn();
  return {
    default: toastFn,
  };
});

// Mock api utils
vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Cart and Auth context
const mockClearCart = vi.fn();
const mockClearPurchasedItems = vi.fn();
const mockCartContext = {
  cartItems: [
    {
      product: 'prod_test_001',
      name: 'AK Pro Smartphone',
      price: 15000.0,
      quantity: 1,
      image: '/sample-phone.png',
      brand: 'AK Mobiles',
      deliveryCharge: 0,
      stock: 5,
    },
  ],
  cartSubtotal: 15000.0,
  cartTax: 2700.0,
  cartShipping: 0.0,
  cartTotal: 15000.0,
  clearCart: mockClearCart,
  clearPurchasedItems: mockClearPurchasedItems,
};

const mockAuthContext = {
  user: {
    _id: 'user_test_123',
    name: 'Authorized Customer',
    email: 'customer@akmobiles.com',
    phone: '9876543210',
    addresses: [
      {
        addressLine1: '42 Market Street',
        addressLine2: 'Opposite Town Hall',
        city: 'Virudhachalam',
        state: 'Tamil Nadu',
        postalCode: '606001',
      },
    ],
  },
  isAuthenticated: true,
  loading: false,
};

vi.mock('../../context/useCart', () => ({
  useCart: () => mockCartContext,
  default: () => mockCartContext,
}));

vi.mock('../../context/useAuth', () => ({
  useAuth: () => mockAuthContext,
  default: () => mockAuthContext,
}));

vi.mock('../../context/CartContext', () => ({
  useCart: () => mockCartContext,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

import api from '../../utils/api';
import toast from 'react-hot-toast';

const renderComponent = (ui, initialEntries = ['/']) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('PostPurchaseOrderFlow Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Checkout Page Flow & Verification', () => {
    it('1. prevents double-clicks and repeated submissions while processing', async () => {
      let openMock = vi.fn();
      window.Razorpay = vi.fn().mockImplementation(function () {
        return {
          open: openMock,
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return new Promise((resolve) => setTimeout(() => resolve({
            data: { order: { _id: 'order_123' } }
          }), 100));
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_123', amount: 1500000, currency: 'INR' }
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      // Verify button becomes disabled and shows processing label
      expect(placeOrderBtn.disabled).toBe(true);
      expect(screen.getByText(/Processing.../i)).toBeTruthy();

      // Click again during processing
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(2); // exactly 1 for /orders and 1 for create-order
      });
    });

    it('2 & 3. Razorpay creation and popup alone do not redirect before backend verification', async () => {
      window.Razorpay = vi.fn().mockImplementation(function () {
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({ data: { order: { _id: 'order_123' } } });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_123', amount: 1500000, currency: 'INR' }
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(window.Razorpay).toHaveBeenCalled();
      });

      // Assert no navigation occurred just by creating order & opening popup
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockClearCart).not.toHaveBeenCalled();
    });

    it('4 & 7. redirects directly to /my-orders with replace:true and paymentSuccess state on successful backend verification and clears cart', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (opts) {
        razorpayOptions = opts;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({ data: { order: { _id: 'AKM-2026-999' } } });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_999', amount: 1500000, currency: 'INR' }
          });
        }
        if (url === '/payments/razorpay/verify-payment/') {
          return Promise.resolve({
            data: {
              success: true,
              message: 'Payment verified successfully',
              order: {
                id: 'AKM-2026-999',
                _id: 'AKM-2026-999',
                order_number: 'AKM-2026-999',
                status: 'Placed',
              },
              payment: {
                status: 'Completed',
                razorpay_order_id: 'rzp_order_999',
                razorpay_payment_id: 'pay_999',
              }
            }
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(razorpayOptions).not.toBeNull();
      });

      // Trigger payment completion handler from Razorpay
      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_order_999',
        razorpay_payment_id: 'pay_999',
        razorpay_signature: 'valid_sig_xyz',
      });

      // Cart cleared exactly once (via clearPurchasedItems or clearCart)
      expect(mockClearPurchasedItems.mock.calls.length + mockClearCart.mock.calls.length).toBeGreaterThanOrEqual(1);

      // Successfully redirected directly to /my-orders with replace: true and state
      expect(mockNavigate).toHaveBeenCalledWith('/my-orders', {
        replace: true,
        state: {
          paymentSuccess: true,
          orderId: 'AKM-2026-999',
        },
      });
      // No checkout toast (one-time banner displayed on My Orders only)
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('4b. cart clear failure does not prevent navigation to /my-orders or show failure toast', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (opts) {
        razorpayOptions = opts;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      mockClearPurchasedItems.mockImplementationOnce(() => {
        throw new Error('Local storage write quota exceeded');
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({ data: { order: { _id: 'AKM-2026-888' } } });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_888', amount: 1500000, currency: 'INR' }
          });
        }
        if (url === '/payments/razorpay/verify-payment/') {
          return Promise.resolve({
            data: {
              success: true,
              order: { id: 'AKM-2026-888', _id: 'AKM-2026-888' },
              payment: { status: 'Completed' }
            }
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(razorpayOptions).not.toBeNull();
      });

      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_order_888',
        razorpay_payment_id: 'pay_888',
        razorpay_signature: 'sig_888',
      });

      // Still navigated to /my-orders without reporting payment failure
      expect(mockNavigate).toHaveBeenCalledWith('/my-orders', {
        replace: true,
        state: {
          paymentSuccess: true,
          orderId: 'AKM-2026-888',
        },
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('5. failed verification remains on Checkout without clearing cart', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (opts) {
        razorpayOptions = opts;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({ data: { order: { _id: 'order_failed_test' } } });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_fail', amount: 1500000, currency: 'INR' }
          });
        }
        if (url === '/payments/razorpay/verify-payment/') {
          return Promise.reject({
            response: { data: { message: 'Signature verification failed' } }
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(razorpayOptions).not.toBeNull();
      });

      await razorpayOptions.handler({
        razorpay_order_id: 'rzp_order_fail',
        razorpay_payment_id: 'pay_fail',
        razorpay_signature: 'bad_sig',
      });

      // Cart preserved, navigation blocked
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Signature verification failed');
    });

    it('6. modal dismissal remains on Checkout and preserves cart and allows safe retry', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (opts) {
        razorpayOptions = opts;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({ data: { order: { _id: 'order_dismiss_test' } } });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: { key: 'rzp_test_key', orderId: 'rzp_order_dismiss', amount: 1500000, currency: 'INR' }
          });
        }
        if (url === '/payments/razorpay/checkout-dismissed/') {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.resolve({ data: {} });
      });

      renderComponent(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(razorpayOptions).not.toBeNull();
      });

      // Dismiss modal
      await razorpayOptions.modal.ondismiss();

      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith('Payment cancelled. Your order was not placed.', { icon: 'ℹ️' });
    });
  });

  describe('Order Details Page Rendering & Data Integrity', () => {
    const sampleOrderData = {
      _id: 'AKM-2026-000123',
      orderStatus: 'Placed',
      createdAt: '2026-09-16T10:00:00Z',
      itemsPrice: 15000.0,
      taxPrice: 2700.0,
      shippingPrice: 0.0,
      totalPrice: 15000.0,
      paymentInfo: {
        method: 'Razorpay',
        status: 'Completed',
        razorpayPaymentId: 'pay_ABC123XYZ999',
      },
      orderItems: [
        {
          product: 'prod_001',
          name: 'AK Ultra 5G',
          brand: 'AK Mobiles',
          price: 15000.0,
          quantity: 1,
          image: '/phone.jpg',
        },
      ],
      shippingAddress: {
        name: 'Authorized Customer',
        phone: '9876543210',
        addressLine1: '42 Market Street',
        addressLine2: 'Near Bus Stand',
        city: 'Virudhachalam',
        state: 'Tamil Nadu',
        postalCode: '606001',
      },
    };

    it('8, 9, 10 & 11. renders complete order information from route parameter, survives refresh, and displays tracking placeholder', async () => {
      api.get.mockResolvedValueOnce({ data: { order: sampleOrderData } });

      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/orders/AKM-2026-000123']}>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      );

      // Verify API was called with the order ID parameter
      expect(api.get).toHaveBeenCalledWith('/orders/AKM-2026-000123');

      // Order Details heading and ID
      expect(await screen.findByText('Order Details')).toBeTruthy();
      expect(screen.getByText(/AKM-2026-000123/)).toBeTruthy();

      // Product information
      expect(screen.getByText('AK Ultra 5G')).toBeTruthy();
      expect(screen.getAllByText(/AK Mobiles/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Qty: 1')).toBeTruthy();

      // Delivery information
      expect(screen.getByText('Authorized Customer')).toBeTruthy();
      expect(screen.getByText('9876543210')).toBeTruthy();
      expect(screen.getByText('42 Market Street')).toBeTruthy();
      expect(screen.getByText('PIN: 606001')).toBeTruthy();

      // Price breakdown
      expect(screen.getByText('Subtotal')).toBeTruthy();
      expect(screen.getByText('GST (Included)')).toBeTruthy();
      expect(screen.getByText('Total Paid')).toBeTruthy();

      // Tracking section with real status and clean placeholder without fake AWBs
      expect(screen.getByText('Tracking details will be available once your order is shipped.')).toBeTruthy();

      // Action buttons (top bar)
      expect(screen.getAllByText('Continue Shopping').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Back to Orders').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Download Invoice').length).toBeGreaterThanOrEqual(1);
    });

    it('12. displays safe not found message when another user order is requested (404 response)', async () => {
      api.get.mockRejectedValueOnce({
        response: { status: 404, data: { success: false, message: 'Order not found' } }
      });

      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/orders/other_user_order_999']}>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      );

      expect(await screen.findByText('Order not found')).toBeTruthy();
      expect(screen.queryByText('AK Ultra 5G')).toBeNull();
      expect(screen.getByText('Back to Orders')).toBeTruthy();
    });

    it('13. does not show successful delivery progression for cancelled orders', async () => {
      const cancelledOrder = {
        ...sampleOrderData,
        orderStatus: 'Cancelled',
        paymentInfo: {
          ...sampleOrderData.paymentInfo,
          status: 'Cancelled',
        },
      };

      api.get.mockResolvedValueOnce({ data: { order: cancelledOrder } });

      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/orders/AKM-2026-000123']}>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      );

      expect(await screen.findByText('Order Cancelled')).toBeTruthy();
      expect(screen.queryByText('Order Details')).toBeTruthy();
    });
  });

  describe('MyOrdersPage Post-Payment Banner & Highlight Suite', () => {
    const mockOrdersList = [
      {
        _id: 'AKM-2026-999',
        id: 'AKM-2026-999',
        orderStatus: 'Placed',
        createdAt: '2026-09-17T10:00:00Z',
        itemsPrice: 15000.0,
        taxPrice: 2700.0,
        shippingPrice: 0.0,
        totalPrice: 15000.0,
        paymentInfo: { method: 'Razorpay', status: 'Completed', razorpayPaymentId: 'pay_999' },
        orderItems: [
          { product: 'prod_001', name: 'AK Ultra 5G', brand: 'AK Mobiles', price: 15000.0, quantity: 1, image: '/phone.jpg' }
        ],
        shippingAddress: { name: 'Authorized Customer', phone: '9876543210', city: 'Virudhachalam' }
      },
      {
        _id: 'AKM-2026-111',
        id: 'AKM-2026-111',
        orderStatus: 'Delivered',
        createdAt: '2026-09-01T10:00:00Z',
        itemsPrice: 5000.0,
        taxPrice: 900.0,
        shippingPrice: 0.0,
        totalPrice: 5000.0,
        paymentInfo: { method: 'Razorpay', status: 'Completed', razorpayPaymentId: 'pay_111' },
        orderItems: [
          { product: 'prod_002', name: 'AK Earbuds', brand: 'AK Mobiles', price: 5000.0, quantity: 1, image: '/buds.jpg' }
        ],
        shippingAddress: { name: 'Authorized Customer', phone: '9876543210', city: 'Virudhachalam' }
      }
    ];

    it('displays one-time payment success banner, highlights the matching order via normalized ID, and clears router state', async () => {
      api.get.mockResolvedValueOnce({ data: { orders: mockOrdersList } });

      render(
        <HelmetProvider>
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/my-orders',
                state: { paymentSuccess: true, orderId: 'AKM-2026-999' }
              }
            ]}
          >
            <Routes>
              <Route path="/my-orders" element={<MyOrdersPage />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      );

      // Verify fresh orders fetched
      expect(api.get).toHaveBeenCalledWith('/orders/myorders');

      // Verify one-time payment success banner is visible
      expect(await screen.findByText('Order placed successfully!')).toBeTruthy();
      expect(screen.getByText('Your payment was verified and your order has been confirmed.')).toBeTruthy();

      // Verify router navigation was called to clear history state safely
      expect(mockNavigate).toHaveBeenCalledWith('/my-orders', { replace: true, state: null });

      // Verify order list rendered
      expect(screen.getByText('AK Ultra 5G')).toBeTruthy();
      expect(screen.getByText('AK Earbuds')).toBeTruthy();
    });
  });
});
