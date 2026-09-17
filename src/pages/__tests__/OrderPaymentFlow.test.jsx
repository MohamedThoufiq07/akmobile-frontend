import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import OrderDetailPage from '../OrderDetailPage';
import CheckoutPage from '../CheckoutPage';

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
const mockCartContext = {
  cartItems: [
    {
      product: 'prod_test_001',
      name: 'Test Smartphone',
      price: 1000.0,
      quantity: 1,
      image: '/test.png',
      countInStock: 5,
    },
  ],
  cartSubtotal: 1000.0,
  cartTax: 180.0,
  cartShipping: 0.0,
  cartTotal: 1000.0,
  clearCart: mockClearCart,
};

const mockAuthContext = {
  user: {
    _id: 'user_test_001',
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    phone: '9000000000',
    addresses: [
      {
        addressLine1: 'Test Address Line 1',
        city: 'Test City',
        state: 'Tamil Nadu',
        postalCode: '600001',
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

const renderWithProviders = (ui) => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('OrderPaymentFlow and Cancellation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OrderDetailPage State Separation', () => {
    it('renders unpaid / cancelled order with Amount Due, disabled invoice, and inactive tracking', async () => {
      const mockOrder = {
        _id: '000000000000000000000001',
        orderStatus: 'AwaitingPayment',
        totalPrice: 1000.0,
        itemsPrice: 820.0,
        taxPrice: 180.0,
        shippingPrice: 0.0,
        createdAt: '2026-09-09T10:00:00Z',
        paymentInfo: {
          method: 'Razorpay',
          status: 'Cancelled',
          razorpayPaymentId: 'pay_test_cancelled_001',
        },
        orderItems: [
          { product: 'prod_test_001', name: 'Test Smartphone', price: 1000.0, quantity: 1 }
        ],
        shippingAddress: {
          name: 'Test Customer',
          phone: '9000000000',
          addressLine1: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          postalCode: '600001',
        },
      };

      api.get.mockResolvedValueOnce({ data: { order: mockOrder } });

      renderWithProviders(<OrderDetailPage />);

      expect(await screen.findByText('Amount Due')).toBeTruthy();
      expect(screen.getByText('Payment Confirmation Required')).toBeTruthy();
      expect(screen.getAllByText('Retry Payment').length).toBeGreaterThanOrEqual(1);

      expect(screen.queryByText('Download Invoice')).toBeNull();
    });

    it('renders completed paid order with Total Paid, active stepper, and enabled invoice', async () => {
      const mockPaidOrder = {
        _id: '000000000000000000000002',
        orderStatus: 'Placed',
        totalPrice: 1000.0,
        itemsPrice: 820.0,
        taxPrice: 180.0,
        shippingPrice: 0.0,
        createdAt: '2026-09-09T10:00:00Z',
        paymentInfo: {
          method: 'Razorpay',
          status: 'Completed',
          razorpayPaymentId: 'pay_test_success_002',
        },
        orderItems: [
          { product: 'prod_test_001', name: 'Test Smartphone', price: 1000.0, quantity: 1 }
        ],
        shippingAddress: {
          name: 'Test Customer',
          phone: '9000000000',
        },
      };

      api.get.mockResolvedValueOnce({ data: { order: mockPaidOrder } });

      renderWithProviders(<OrderDetailPage />);

      expect(await screen.findByText('Total Paid')).toBeTruthy();
      expect(screen.getByText('Order Placed')).toBeTruthy();

      const invoiceBtn = screen.getAllByText('Download Invoice')[0].closest('button');
      expect(invoiceBtn?.disabled).toBe(false);
    });
  });

  describe('Checkout Cancellation & Dismissal Flow', () => {
    it('calls checkout-dismissed on modal close, retains cart, does not navigate to order details, and does not confirm order', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (options) {
        razorpayOptions = options;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({
            data: {
              order: {
                _id: '000000000000000000000001',
                orderStatus: 'AwaitingPayment',
              },
            },
          });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: {
              keyId: 'rzp_test_key_123',
              razorpayOrderId: 'order_test_rzp_001',
              amount: 100000,
              currency: 'INR',
              internalOrderId: '000000000000000000000001',
            },
          });
        }
        if (url === '/payments/razorpay/checkout-dismissed/') {
          return Promise.resolve({
            data: {
              success: true,
              status: 'cancelled',
              message: 'Checkout dismissed. Payment marked cancelled.',
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithProviders(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(window.Razorpay).toHaveBeenCalled();
      });

      expect(razorpayOptions).not.toBeNull();
      expect(razorpayOptions.modal).toBeDefined();
      expect(typeof razorpayOptions.modal.ondismiss).toBe('function');

      // Trigger modal dismissal
      await razorpayOptions.modal.ondismiss();

      // 1. Verify checkout-dismissed API was called with required IDs
      expect(api.post).toHaveBeenCalledWith(
        '/payments/razorpay/checkout-dismissed/',
        expect.objectContaining({
          internalOrderId: '000000000000000000000001',
          razorpayOrderId: 'order_test_rzp_001',
        })
      );

      // 2. Dismissal retains the cart (clearCart NOT called)
      expect(mockClearCart).not.toHaveBeenCalled();

      // 3. Dismissal does NOT navigate to order details or order success
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('payment.failed event retains the cart and does not navigate or confirm order', async () => {
      let failureHandler = null;
      window.Razorpay = vi.fn().mockImplementation(function () {
        return {
          open: vi.fn(),
          on: function (event, handler) {
            if (event === 'payment.failed') {
              failureHandler = handler;
            }
          },
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({
            data: {
              order: {
                _id: '000000000000000000000001',
                orderStatus: 'AwaitingPayment',
              },
            },
          });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: {
              keyId: 'rzp_test_key_123',
              razorpayOrderId: 'order_test_rzp_001',
              amount: 100000,
              currency: 'INR',
              internalOrderId: '000000000000000000000001',
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithProviders(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(failureHandler).not.toBeNull();
      });

      // Trigger payment.failed
      failureHandler({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Payment was cancelled or failed by user',
        },
      });

      // Cart retained, no order confirmation navigation
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Payment failed'));
    });

    it('successful verify-payment clears cart and navigates to success page only after backend confirmation', async () => {
      let razorpayOptions = null;
      window.Razorpay = vi.fn().mockImplementation(function (options) {
        razorpayOptions = options;
        return {
          open: vi.fn(),
          on: vi.fn(),
        };
      });

      api.post.mockImplementation((url) => {
        if (url === '/orders') {
          return Promise.resolve({
            data: {
              order: {
                _id: '000000000000000000000001',
                orderStatus: 'AwaitingPayment',
              },
            },
          });
        }
        if (url === '/payments/razorpay/create-order/') {
          return Promise.resolve({
            data: {
              keyId: 'rzp_test_key_123',
              razorpayOrderId: 'order_test_rzp_001',
              amount: 100000,
              currency: 'INR',
              internalOrderId: '000000000000000000000001',
            },
          });
        }
        if (url === '/payments/razorpay/verify-payment/') {
          return Promise.resolve({
            data: {
              success: true,
              status: 'captured',
              message: 'Payment verified successfully.',
              orderId: '000000000000000000000001',
              order: {
                id: '000000000000000000000001',
                _id: '000000000000000000000001',
                order_number: '000000000000000000000001',
                status: 'Placed',
              },
              payment: {
                status: 'Completed',
                razorpay_order_id: 'order_test_rzp_001',
                razorpay_payment_id: 'pay_test_success_001',
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      renderWithProviders(<CheckoutPage />);

      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      fireEvent.click(placeOrderBtn);

      await waitFor(() => {
        expect(razorpayOptions).not.toBeNull();
      });

      // Trigger successful Razorpay handler
      await razorpayOptions.handler({
        razorpay_order_id: 'order_test_rzp_001',
        razorpay_payment_id: 'pay_test_success_001',
        razorpay_signature: 'test_sig_abc_123',
      });

      // Verify payment API call
      expect(api.post).toHaveBeenCalledWith(
        '/payments/razorpay/verify-payment/',
        expect.objectContaining({
          orderId: '000000000000000000000001',
          razorpay_order_id: 'order_test_rzp_001',
          razorpay_payment_id: 'pay_test_success_001',
        })
      );

      // Cart cleared and navigated directly to My Orders page with replace: true and state
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/my-orders', {
        replace: true,
        state: {
          paymentSuccess: true,
          orderId: '000000000000000000000001',
        },
      });
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Timezone and Date Formatting Suite', () => {
    it('converts UTC timestamps into exact Asia/Kolkata (IST) display format', async () => {
      const { formatISTDateTime, formatISTDateOnly } = await import('../../utils/dateFormatter');

      // Exact test case from requirement: 2026-09-10T04:32:24Z -> 10 Sep 2026, 10:02 AM IST
      const utcTimestamp = '2026-09-10T04:32:24Z';
      const formatted = formatISTDateTime(utcTimestamp);
      expect(formatted).toBe('10 Sep 2026, 10:02 AM IST');

      // Date only formatting
      const dateOnly = formatISTDateOnly(utcTimestamp);
      expect(dateOnly).toBe('10 Sep 2026');

      // Safe fallback handling
      expect(formatISTDateTime(null)).toBe('N/A');
      expect(formatISTDateTime(undefined)).toBe('N/A');
      expect(formatISTDateTime('invalid-date')).toBe('N/A');
      expect(formatISTDateTime('', 'Custom Fallback')).toBe('Custom Fallback');
    });
  });
});
