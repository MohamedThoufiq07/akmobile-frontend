import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from './useAuth';
import { disableGoogleAutoSelect } from '../utils/googleIdentity';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/profile');
          if (!ignore) {
            // Admin accounts are NOT storefront users. If an admin token ended up
            // in the storefront session (e.g. a stale token), drop it.
            if (data.user.role === 'admin') {
              localStorage.removeItem('token');
            } else {
              setUser(data.user);
              setIsAuthenticated(true);
            }
          }
        } catch {
          if (!ignore) {
            localStorage.removeItem('token');
          }
        }
      }
      if (!ignore) {
        setLoading(false);
      }
    };
    checkAuth();
    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Admin accounts may not sign in to the storefront. Show a generic
      // credentials error so it doesn't reveal that the email is an admin.
      if (data.user.role === 'admin') {
        toast.error('Incorrect email or password');
        return { success: false, message: 'Incorrect email or password' };
      }
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const googleLogin = async (credential, password = null) => {
    try {
      const payload = { credential };
      if (password) {
        payload.password = password;
      }
      const { data } = await api.post('/accounts/google/', payload);
      if (data.user.role === 'admin') {
        toast.error('Customer account required');
        return { success: false, code: 'CUSTOMER_ACCOUNT_REQUIRED', message: 'Customer account required' };
      }
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Signed in with Google successfully!');
      return { success: true, user: data.user };
    } catch (error) {
      const resData = error.response?.data;
      const code = resData?.code || 'GOOGLE_AUTH_FAILED';
      const msg = resData?.message || 'Google authentication failed';
      if (code !== 'ACCOUNT_LINK_REQUIRED') {
        toast.error(msg);
      }
      return { success: false, code, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    disableGoogleAutoSelect();
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const { data } = await api.put('/auth/profile', userData);
      setUser(data.user);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        googleLogin,
        register,
        logout,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
