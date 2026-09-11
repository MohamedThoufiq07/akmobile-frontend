import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/useAdminAuth';
import { Reveal } from '../../components/ui/animations';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Already an admin? go straight in.
  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // The admin context verifies the role before storing any session.
    const result = await login(email, password);
    if (result.success) {
      navigate('/admin', { replace: true });
    } else {
      toast.error(result.message || 'Login failed');
    }
    setIsSubmitting(false);
  };

  const inputCls =
    'w-full pl-10 pr-3 py-3 min-h-[44px] rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition';

  return (
    <>
      <Helmet>
        <title>Admin Sign In | AK Mobiles</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
        <Reveal y={16} className="w-full max-w-md">
          {/* Brand / badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4">
              <FiShield size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              <span className="text-brand-orange">AK</span> Admin Panel
            </h1>
            <p className="text-sm text-slate-500 mt-1">Authorized staff sign-in only</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-7">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email</label>
                <div className="relative">
                  <FiMail className="absolute inset-y-0 left-0 ml-3 my-auto text-slate-400" />
                  <input
                    type="email"
                    required
                    className={inputCls}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <Link to="/admin/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute inset-y-0 left-0 ml-3 my-auto text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={inputCls + ' pr-10'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-70 shadow-lg shadow-blue-600/20"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            This is a restricted area. Customer accounts are not permitted.
          </p>
        </Reveal>
      </div>
    </>
  );
};

export default AdminLogin;
