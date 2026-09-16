import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../api';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Axios API Interceptors Suite', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete window.location;
    window.location = { href: '', pathname: '/' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('1. request interceptor attaches Bearer token from localStorage', async () => {
    localStorage.setItem('token', 'my-jwt-token-123');
    
    // Test request interceptor directly
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    const result = requestHandler(config);

    expect(result.headers.Authorization).toBe('Bearer my-jwt-token-123');
  });

  it('2. 401 on /accounts/google/ does NOT remove token, does NOT trigger session expired toast, and does NOT redirect', async () => {
    localStorage.setItem('token', 'existing-token');
    
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = {
      response: {
        status: 401,
        data: {
          success: false,
          code: 'ACCOUNT_LINK_PASSWORD_INVALID',
          message: 'Incorrect password for linking this account. Please try again.',
        },
      },
      config: {
        url: '/accounts/google/',
        headers: {},
      },
    };

    await expect(errorHandler(error)).rejects.toEqual(error);

    expect(localStorage.getItem('token')).toBe('existing-token');
    expect(toast.error).not.toHaveBeenCalledWith('Session expired. Please login again.');
    expect(window.location.href).toBe('');
  });

  it('3. 401 on public auth endpoints (/auth/login, /auth/register, /auth/forgot-password, /auth/reset-password) does NOT trigger session expiration', async () => {
    localStorage.setItem('token', 'keep-token');
    const errorHandler = api.interceptors.response.handlers[0].rejected;

    const endpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    for (const url of endpoints) {
      vi.clearAllMocks();
      const error = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: { url, headers: {} },
      };

      await expect(errorHandler(error)).rejects.toEqual(error);
      expect(localStorage.getItem('token')).toBe('keep-token');
      expect(toast.error).not.toHaveBeenCalledWith('Session expired. Please login again.');
      expect(window.location.href).toBe('');
    }
  });

  it('4. 401 on unauthenticated request (no Bearer header) does NOT trigger session expiration', async () => {
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = {
      response: { status: 401, data: { message: 'Unauthorized' } },
      config: { url: '/products/public-endpoint', headers: {} },
    };

    await expect(errorHandler(error)).rejects.toEqual(error);
    expect(toast.error).not.toHaveBeenCalledWith('Session expired. Please login again.');
    expect(window.location.href).toBe('');
  });

  it('5. 401 on protected endpoint with Bearer token triggers token removal, session expired toast, and redirect', async () => {
    localStorage.setItem('token', 'expired-jwt-token');
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = {
      response: { status: 401, data: { message: 'Token expired' } },
      config: {
        url: '/orders/my-orders',
        headers: {
          Authorization: 'Bearer expired-jwt-token',
        },
      },
    };

    await expect(errorHandler(error)).rejects.toEqual(error);

    expect(localStorage.getItem('token')).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
    expect(window.location.href).toBe('/login');
  });

  it('6. 401 on /auth/profile removes token but silently suppresses session expired toast and redirect', async () => {
    localStorage.setItem('token', 'stale-token');
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = {
      response: { status: 401, data: { message: 'Invalid token' } },
      config: {
        url: '/auth/profile',
        headers: {
          Authorization: 'Bearer stale-token',
        },
      },
    };

    await expect(errorHandler(error)).rejects.toEqual(error);

    expect(localStorage.getItem('token')).toBeNull();
    expect(toast.error).not.toHaveBeenCalledWith('Session expired. Please login again.');
    expect(window.location.href).toBe('');
  });
});
