import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/useAuth';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { Reveal } from '../components/ui/animations';
import logo from '../assets/logo_dark_text.png';

const sanitizeRedirect = (raw) => {
  if (!raw || typeof raw !== 'string') return '/';
  if (raw.startsWith('//') || raw.includes(':') || raw.startsWith('http')) {
    return '/';
  }
  if (!raw.startsWith('/')) {
    if (raw === 'checkout') return '/checkout';
    return '/';
  }
  if (raw.startsWith('/admin')) {
    return '/';
  }
  return raw;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth & Account Linking state
  const [pendingCredential, setPendingCredential] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { login, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const rawRedirect = new URLSearchParams(location.search).get('redirect');
  const safeRedirect = sanitizeRedirect(rawRedirect);

  const handleCloseModal = useCallback(() => {
    if (isLinking) return;
    setShowLinkModal(false);
    setPendingCredential(null);
    setLinkPassword('');
  }, [isLinking]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(safeRedirect);
    }
  }, [isAuthenticated, navigate, safeRedirect]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLinkModal && !isLinking) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLinkModal, isLinking, handleCloseModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(safeRedirect);
    }

    setIsSubmitting(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isGoogleSubmitting || !credentialResponse?.credential) return;
    setIsGoogleSubmitting(true);

    const result = await googleLogin(credentialResponse.credential);

    if (result.success) {
      navigate(safeRedirect);
    } else if (result.code === 'ACCOUNT_LINK_REQUIRED') {
      setPendingCredential(credentialResponse.credential);
      setLinkPassword('');
      setShowLinkModal(true);
    }

    setIsGoogleSubmitting(false);
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed.');
  };

  const handleUnconfiguredGoogle = () => {
    toast.error('Google sign-in is not configured yet.');
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!pendingCredential || !linkPassword || isLinking) return;
    setIsLinking(true);

    const result = await googleLogin(pendingCredential, linkPassword);

    if (result.success) {
      handleCloseModal();
      navigate(safeRedirect);
    } else {
      setLinkPassword('');
    }

    setIsLinking(false);
  };

  return (
    <>
      <Helmet>
        <title>Login | AK Mobiles</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center animated-gradient-bg py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-30 bg-indigo-600"></div>
          <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[100px] opacity-25 bg-purple-600"></div>
        </div>

        <Reveal y={16} className="w-full max-w-md glass-card rounded-2xl shadow-lg pt-4 pb-5 px-6 relative z-10 border border-slate-200/60 text-slate-800">
          <div className="text-center mb-3">
            <Link to="/" className="inline-block mb-1">
              <img src={logo} alt="AK Mobiles" className="h-16 mx-auto object-contain" />
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome Back</h2>
            <p className="text-xs text-slate-500">Sign in to your AK Mobiles account</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiMail />
                </div>
                <input
                  type="email"
                  required
                  className="input-field pl-10 bg-white/90 border-slate-200 text-slate-850 py-3 text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-blue hover:text-brand-blue/80">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10 bg-white/90 border-slate-200 text-slate-850 py-3 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-blue"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-premium py-3 disabled:opacity-70 text-sm font-bold"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="bg-[#f8fafc] px-3 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          {googleClientId && googleClientId.trim() ? (
            <GoogleSignInButton
              clientId={googleClientId}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          ) : (
            <button
              type="button"
              onClick={handleUnconfiguredGoogle}
              className="w-full btn-premium-outline py-3 flex items-center justify-center gap-2.5 text-sm font-bold bg-white text-slate-700 hover:text-slate-800 border border-slate-200/80 shadow-sm"
            >
              <FcGoogle className="text-lg" />
              Continue with Google
            </button>
          )}

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-200/80 pt-4">
            Don't have an account?{' '}
            <Link to={`/register${rawRedirect ? `?redirect=${encodeURIComponent(rawRedirect)}` : ''}`} className="font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
              Create one now
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Account Linking Modal */}
      {showLinkModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 text-slate-800 relative">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-3 text-xl">
                <FiLock />
              </div>
              <h3 id="link-modal-title" className="text-xl font-extrabold text-slate-900">
                Link Existing Account
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                An account already exists with this email address. Enter your existing AK Mobiles password to securely link your Google account.
              </p>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">AK Mobiles Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiLock />
                  </div>
                  <input
                    type={showLinkPassword ? "text" : "password"}
                    required
                    autoFocus
                    className="input-field pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-900 py-3 text-sm focus:bg-white"
                    placeholder="Enter your current password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    disabled={isLinking}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-blue"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                  >
                    {showLinkPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLinking}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking || !linkPassword}
                  className="flex-1 btn-premium py-2.5 px-4 text-sm font-bold disabled:opacity-50"
                >
                  {isLinking ? 'Linking...' : 'Confirm & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
