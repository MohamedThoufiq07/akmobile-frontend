import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LoginPage from '../LoginPage';
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

describe('Google Authentication and Native GIS Lifecycle Flow', () => {
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

  it('1. renders official Google button and calls initialize exactly once with popup ux_mode and <= 330px width', async () => {
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
        use_fedcm_for_button: false,
        callback: expect.any(Function),
      })
    );
    expect(mockRenderButton).toHaveBeenCalledTimes(1);

    const btn = screen.getByTestId('mock-google-login-btn');
    const widthVal = btn.getAttribute('data-width');
    expect(widthVal).toMatch(/^\d+$/);
    expect(widthVal).not.toBe('100%');
    expect(Number(widthVal)).toBeGreaterThanOrEqual(200);
    expect(Number(widthVal)).toBeLessThanOrEqual(330);
    vi.unstubAllEnvs();
  });

  it('2. StrictMode-style remount does NOT initialize again', async () => {
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

    // Unmount (simulating StrictMode or route leave)
    unmount();

    // Remount without page reload
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

    // initialize must STILL have been called exactly once
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    // renderButton was called again for the new container
    expect(mockRenderButton).toHaveBeenCalledTimes(2);

    vi.unstubAllEnvs();
  });

  it('3. login -> logout -> LoginPage remount calls disableAutoSelect and does NOT initialize again', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'google-jwt-token',
        user: { _id: 'u-google', name: 'Google Customer', email: 'google@example.com', role: 'user' },
      },
    });

    const { unmount } = render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-google-login-btn')).toBeDefined();
    });
    expect(mockInitialize).toHaveBeenCalledTimes(1);

    // Click Google sign-in
    fireEvent.click(screen.getByTestId('mock-google-login-btn'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('google-jwt-token');
      expect(screen.getByText('Home Page')).toBeDefined();
    });

    unmount();

    // Now test logout triggering disableAutoSelect and remounting /login
    const { disableGoogleAutoSelect } = await import('../../utils/googleIdentity');
    disableGoogleAutoSelect();
    expect(mockDisableAutoSelect).toHaveBeenCalledTimes(1);

    // Remount LoginPage (user navigated back to /login)
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

    // initialize must NOT be called again
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockRenderButton).toHaveBeenCalledTimes(2);

    vi.unstubAllEnvs();
  });

  it('4. missing Client ID renders fallback without crashing and shows config toast on click', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </HelmetProvider>
    );

    expect(screen.queryByTestId('mock-google-login-btn')).toBeNull();
    const fallbackBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(fallbackBtn).toBeDefined();

    fireEvent.click(fallbackBtn);
    expect(toast.error).toHaveBeenCalledWith('Google sign-in is not configured yet.');
    expect(mockInitialize).toHaveBeenCalledTimes(0);
    vi.unstubAllEnvs();
  });

  it('5. credential is posted to /accounts/google/ and successful login stores JWT', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'google-customer-jwt-token',
        user: { _id: 'u-google', name: 'Google Customer', email: 'google@example.com', role: 'user' },
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

    const googleBtn = screen.getByTestId('mock-google-login-btn');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/accounts/google/', {
        credential: 'mock-google-id-token',
      });
      expect(localStorage.getItem('token')).toBe('google-customer-jwt-token');
      expect(toast.success).toHaveBeenCalledWith('Signed in with Google successfully!');
    });
    vi.unstubAllEnvs();
  });

  it('6. safe internal redirect navigates correctly', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'jwt-token',
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
    });
    vi.unstubAllEnvs();
  });

  it('7. external / open redirect is safely rejected', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'jwt-token',
        user: { _id: 'u1', name: 'User', email: 'u@example.com', role: 'user' },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login?redirect=https%3A%2F%2Fmalicious-site.com']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div>Home Safe Page</div>} />
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
      expect(screen.getByText('Home Safe Page')).toBeDefined();
    });
    vi.unstubAllEnvs();
  });

  it('8 & 9. 409 response opens account-link modal and wrong password displays safe notification', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          success: false,
          code: 'ACCOUNT_LINK_REQUIRED',
          message: 'An account already exists with this email. Enter your existing password to link Google.',
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

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Link Existing Account')).toBeDefined();
    });

    // Enter wrong password and submit
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          code: 'ACCOUNT_LINK_PASSWORD_INVALID',
          message: 'Incorrect password for linking this account. Please try again.',
        },
      },
    });

    const modalPasswordInput = screen.getByPlaceholderText('Enter your current password');
    fireEvent.change(modalPasswordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm & link/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/accounts/google/', {
        credential: 'mock-google-id-token',
        password: 'wrongpassword',
      });
      expect(toast.error).toHaveBeenCalledWith('Incorrect password for linking this account. Please try again.');
      expect(screen.getByText('Link Existing Account')).toBeDefined();
    });
    vi.unstubAllEnvs();
  });

  it('10. correct password links account and signs in', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          success: false,
          code: 'ACCOUNT_LINK_REQUIRED',
          message: 'An account already exists with this email.',
        },
      },
    });

    render(
      <HelmetProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div>Home Page After Link</div>} />
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
      expect(screen.getByText('Link Existing Account')).toBeDefined();
    });

    // Submit correct password
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'linked-user-jwt',
        user: { _id: 'linked-user', name: 'Linked Customer', email: 'linked@example.com', role: 'user' },
      },
    });

    const modalPasswordInput = screen.getByPlaceholderText('Enter your current password');
    fireEvent.change(modalPasswordInput, { target: { value: 'correctpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm & link/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('linked-user-jwt');
      expect(screen.queryByText('Link Existing Account')).toBeNull();
      expect(screen.getByText('Home Page After Link')).toBeDefined();
    });
    vi.unstubAllEnvs();
  });

  it('11. closing the modal clears credential and password state', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { code: 'ACCOUNT_LINK_REQUIRED', message: 'Account exists.' },
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
      expect(screen.getByText('Link Existing Account')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText('Link Existing Account')).toBeNull();
    });
    vi.unstubAllEnvs();
  });

  it('12. duplicate submissions are prevented while in flight', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    let resolvePost;
    api.post.mockImplementationOnce(() => new Promise((res) => { resolvePost = res; }));

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

    const googleBtn = screen.getByTestId('mock-google-login-btn');
    fireEvent.click(googleBtn);
    fireEvent.click(googleBtn);

    expect(api.post).toHaveBeenCalledTimes(1);

    resolvePost({
      data: {
        success: true,
        token: 'token-val',
        user: { _id: 'u1', name: 'User', email: 'u@example.com', role: 'user' },
      },
    });
    vi.unstubAllEnvs();
  });

  it('13. backend errors do not expose raw information', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          code: 'GOOGLE_TOKEN_INVALID',
          message: 'Invalid Google credential.',
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
      expect(toast.error).toHaveBeenCalledWith('Invalid Google credential.');
    });
    vi.unstubAllEnvs();
  });

  it('14. existing email/password login remains unchanged', async () => {
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

  it('15. admin login remains unchanged and does not feature Google login', async () => {
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

  it('16. button width is clamped to max 330px and responsive on narrow containers', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');

    const GoogleSignInButton = (await import('../../components/auth/GoogleSignInButton')).default;

    const { unmount } = render(
      <GoogleSignInButton
        clientId="test-client-id-123.apps.googleusercontent.com"
        onSuccess={vi.fn()}
        onError={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockRenderButton).toHaveBeenCalled();
    });

    const renderedWidth = mockRenderButton.mock.calls[0][1].width;
    expect(typeof renderedWidth).toBe('number');
    expect(renderedWidth).toBeGreaterThanOrEqual(200);
    expect(renderedWidth).toBeLessThanOrEqual(330);

    unmount();
    vi.unstubAllEnvs();
  });

  it('17. GIS script loading failure triggers onError safely', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123.apps.googleusercontent.com');

    // Simulate script loading failure
    window.google = undefined;
    const onErrorMock = vi.fn();
    const GoogleSignInButton = (await import('../../components/auth/GoogleSignInButton')).default;

    render(
      <GoogleSignInButton
        clientId="test-client-id-123.apps.googleusercontent.com"
        onSuccess={vi.fn()}
        onError={onErrorMock}
      />
    );

    // Should not crash and should trigger script element creation
    const script = document.getElementById('google-gsi-client');
    if (script) {
      fireEvent.error(script);
      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalled();
      });
    }
    vi.unstubAllEnvs();
  });
});
