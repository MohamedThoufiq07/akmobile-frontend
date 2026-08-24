import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layouts (eager — shell shown on every route)
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages (lazy — each becomes its own chunk, loaded on demand)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const Cart = lazy(() => import('./pages/Cart'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));

// Policy and Support Pages
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'));
const RefundCancellationPolicyPage = lazy(() => import('./pages/RefundCancellationPolicyPage'));
const ShippingDeliveryPolicyPage = lazy(() => import('./pages/ShippingDeliveryPolicyPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));

// Admin (heavy: recharts) — kept out of the main bundle entirely
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminFlashSale = lazy(() => import('./pages/admin/AdminFlashSale'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminForgotPassword = lazy(() => import('./pages/admin/AdminForgotPassword'));

// Admin auth is a SEPARATE session from the storefront (its own token/context).
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
const AdminRoute = () => {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
              }}
            />
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes with Standard Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  
                  {/* Policy and Customer Support Routes */}
                  <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="terms-and-conditions" element={<TermsConditionsPage />} />
                  <Route path="refund-policy" element={<RefundCancellationPolicyPage />} />
                  <Route path="shipping-policy" element={<ShippingDeliveryPolicyPage />} />
                  <Route path="faq" element={<FAQPage />} />
                  <Route path="track-order" element={<TrackOrderPage />} />
                  
                  {/* Profile Route inside layout */}
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Order Routes (Protected internally by components) */}
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-success/:id" element={<OrderSuccessPage />} />
                  <Route path="my-orders" element={<MyOrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Standalone Auth Routes (NO Layout header/footer) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Admin area — wrapped in its OWN auth provider (separate
                    session from the storefront). /admin/login is public within
                    it; everything else requires an admin session. */}
                <Route path="/admin" element={<AdminAuthProvider />}>
                  <Route path="login" element={<AdminLogin />} />
                  <Route path="forgot-password" element={<AdminForgotPassword />} />
                  <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="flash-sale" element={<AdminFlashSale />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="messages" element={<AdminMessages />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
              </Suspense>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
