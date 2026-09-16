import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LoginPage from '../LoginPage';
import RegisterPage from '../RegisterPage';
import AdminLogin from '../admin/AdminLogin';
import { AuthProvider } from '../../context/AuthContext';
import { AdminAuthProvider } from '../../context/AdminAuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { __resetGoogleIdentityStateForTests } from '../../utils/googleIdentity';

vi.mock('../../utils/api');
vi.mock('../../utils/adminApi');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock animations
vi.mock('../../components/ui/animations', () => ({
  Reveal: ({ children, className }) => <div className={className}>{children}</div>,
}));

describe('Google Authentication & Simplified Auth Flow', () => {
  let mockInitialize;
  let mockRenderButton;
  let mockDisableAutoSelect;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    __resetGoogleIdentityStateForTests();

    mockInitialize = vi.fn();
    mockRenderButton = vi.fn((container, options) => {
      if (!container) return;
      container.innerHTML = '';
      const btn = document.createElement('button');
      btn.setAttribute('data-testid', 'mock-google-login-btn');
      btn.setAttribute('data-width', String(options?.width || '330'));
      btn.textContent = 'Official Google Button';
      btn.onclick = () => {
        const lastCall = mockInitialize.mock.calls[mockInitialize.mock.calls.length - 1];
        const callback = lastCall?.[0]?.callback;
        if (callback) {
          callback({ credential: 'mock-google-id-token' });
        }
      };
      container.appendChild(btn);
    });
    mockDisableAutoSelect = vi.fn();

    window.google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
          disableAutoSelect: mockDisableAutoSelect,
        },
      },
    };
  });

  it('1. RegisterPage contains no Google button or Google divider', () => {
    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/register']}>
            <RegisterPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    expect(screen.queryByTestId('mock-google-login-btn')).toBeNull();
    expect(screen.queryByText(/continue with google/i)).toBeNull();
    expect(screen.queryByText(/or continue with/i)).toBeNull();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
  });

  it('2. Registration redirects to /login without storing a JWT', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Account created successfully! Please sign in.',
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repeat your password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Account created successfully! Please sign in.');
      expect(screen.getByText('Welcome Back')).toBeDefined();
      // Email was prefilled on LoginPage via location.state
      expect(screen.getByPlaceholderText('you@example.com').value).toBe('john@example.com');
    });
  });

  it('3. Google button exists only on LoginPage with FedCM enabled and width <= 330px', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-client-id-123.apps.googleusercontent.com',
        ux_mode: 'popup',
        use_fedcm_for_button: true,
        callback: expect.any(Function),
      })
    );
    expect(mockRenderButton).toHaveBeenCalledTimes(1);

    const btn = screen.getByTestId('mock-google-login-btn');
    const widthVal = btn.getAttribute('data-width');
    expect(Number(widthVal)).toBeLessThanOrEqual(330);
    vi.unstubAllEnvs();
  });

  it('4 & 5. Existing customer Google login sends only credential and succeeds directly with no linking modal', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'google-auto-linked-jwt',
        user: { _id: 'u-existing', name: 'Existing Customer', email: 'existing@gmail.com', role: 'user' },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('mock-google-login-btn'));

    await waitFor(() => {
      // Sent only credential, no password
      expect(api.post).toHaveBeenCalledWith('/accounts/google/', {
        credential: 'mock-google-id-token',
      });
      // Direct login: no modal
      expect(screen.queryByText('Link Existing Account')).toBeNull();
      expect(localStorage.getItem('token')).toBe('google-auto-linked-jwt');
      expect(toast.success).toHaveBeenCalledWith('Signed in with Google successfully!');
    });
    vi.unstubAllEnvs();
  });

  it('6. Successful login stores JWT and redirects safely to internal path', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'redirect-jwt-token',
        user: { _id: 'u1', name: 'User', email: 'u@example.com', role: 'user' },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login?redirect=%2Fcheckout']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/checkout" element={<div>Checkout Target Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('mock-google-login-btn'));

    await waitFor(() => {
      expect(screen.getByText('Checkout Target Page')).toBeDefined();
      expect(localStorage.getItem('token')).toBe('redirect-jwt-token');
    });
    vi.unstubAllEnvs();
  });

  it('7. Error responses show one safe notification and no modal', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          success: false,
          code: 'GOOGLE_EMAIL_NOT_AUTHORITATIVE',
          message: 'This Google account cannot be automatically linked. Please sign in using your email and password, or reset your password.',
        },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('mock-google-login-btn'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This Google account cannot be automatically linked. Please sign in using your email and password, or reset your password.'
      );
      expect(screen.queryByText('Link Existing Account')).toBeNull();
    });
    vi.unstubAllEnvs();
  });

  it('8. Normal email/password login remains functional', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'pw-jwt-token',
        user: { _id: 'u1', name: 'Password User', email: 'pw@example.com', role: 'user' },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'pw@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'pw@example.com',
        password: 'secret123',
      });
      expect(localStorage.getItem('token')).toBe('pw-jwt-token');
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
    });
  });

  it('9. Logout clears the AK Mobiles session and invokes disableAutoSelect', async () => {
    const { disableGoogleAutoSelect } = await import('../../utils/googleIdentity');
    localStorage.setItem('token', 'active-token');

    disableGoogleAutoSelect();
    expect(mockDisableAutoSelect).toHaveBeenCalledTimes(1);
  });

  it('10. StrictMode-style remount does NOT initialize GIS multiple times', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');

    const { unmount } = render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    unmount();

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockRenderButton).toHaveBeenCalledTimes(2);

    vi.unstubAllEnvs();
  });

  it('11. Admin login remains unchanged and does not feature Google login', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <Routes>
            <Route path="/admin" element={<AdminAuthProvider />}>
              <Route path="login" element={<AdminLogin />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('mock-google-login-btn')).toBeNull();
      expect(screen.queryByText(/continue with google/i)).toBeNull();
      expect(screen.getByRole('button', { name: /sign in to dashboard/i })).toBeDefined();
    });
  });
});
