import { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiTrendingUp, FiPackage, FiShoppingBag, FiUsers, FiMail, FiZap, FiImage, FiLogOut, FiExternalLink, FiMenu, FiX,
} from 'react-icons/fi';
import { useAdminAuth } from '../../context/useAdminAuth';
import { useConfirm } from '../../context/useConfirm';
import { useNotification } from '../../context/useNotification';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: FiTrendingUp, end: true },
  { to: '/admin/products', label: 'Products', icon: FiPackage },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/banners', label: 'Banners CMS', icon: FiImage },
  { to: '/admin/flash-sale', label: 'Flash Sale', icon: FiZap },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/messages', label: 'Messages', icon: FiMail },
];

const TITLES = {
  '/admin': 'Dashboard Overview',
  '/admin/products': 'Manage Products',
  '/admin/orders': 'Manage Orders',
  '/admin/banners': 'Hero Banners CMS',
  '/admin/flash-sale': 'Flash Sale',
  '/admin/users': 'Customers',
  '/admin/messages': 'Contact Messages',
};

const AdminLayout = () => {
  const { admin: user, logout } = useAdminAuth();
  const { confirm } = useConfirm();
  const notify = useNotification();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'Admin';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Log out of Admin?',
      message: 'You will need to sign in again to access the admin dashboard.',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    logout();
    notify.success('Logged out successfully');
    navigate('/admin/login', { replace: true });
  };

  // Shared sidebar inner content (identical on desktop + mobile drawer).
  const sidebarContent = (
    <>
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-orange text-white text-sm">AK</span>
          Admin
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobileNav}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <Link to="/" onClick={closeMobileNav} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 px-1">
          <FiExternalLink size={16} /> View Storefront
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-none truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-1">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <Helmet>
        <title>{title} | AK Mobiles Admin</title>
      </Helmet>

      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar — desktop (fixed) */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
          {sidebarContent}
        </div>

        {/* Sidebar — mobile slide-in drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] bg-white border-r border-slate-200 flex flex-col shadow-xl lg:hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <FiX />
                </button>
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white shadow-sm border-b border-slate-200 p-4 px-4 sm:px-6 flex justify-between items-center gap-3 z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0"
                aria-label="Open menu"
              >
                <FiMenu size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{title}</h1>
            </div>
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-brand-orange transition-colors whitespace-nowrap shrink-0">
              <span className="hidden sm:inline">View Storefront →</span>
              <span className="sm:hidden">Store →</span>
            </Link>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
