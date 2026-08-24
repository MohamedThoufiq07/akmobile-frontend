import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { Reveal } from '../components/ui/animations';
import logo from '../assets/logo_dark_text.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect === 'checkout' ? '/checkout' : redirect);
    }
  }, [isAuthenticated, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(redirect === 'checkout' ? '/checkout' : redirect);
    }

    setIsSubmitting(false);
  };

  const handleGoogleSignIn = () => {
    toast.success('Google login clicked! (Integration coming soon)');
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
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full btn-premium-outline py-3 flex items-center justify-center gap-2.5 text-sm font-bold bg-white text-slate-700 hover:text-slate-800 border border-slate-200/80 shadow-sm"
          >
            <FcGoogle className="text-lg" />
            Continue with Google
          </button>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-200/80 pt-4">
            Don't have an account?{' '}
            <Link to={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
              Create one now
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
};

export default LoginPage;
