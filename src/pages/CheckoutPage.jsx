import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../utils/api';
import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';
import { Reveal } from '../components/ui/animations';
import { CheckoutSkeleton, PageSkeleton } from '../components/ui/skeleton';
import logo from '../assets/logo.png';
import { getValidImageUrl } from '../utils/imageHelper';

const CheckoutStepBar = () => {
  const steps = ['Browse', 'Cart', 'Checkout', 'Payment'];
  return (
    <div className="flex items-center justify-center max-w-xl mx-auto mb-10 select-none">
      {steps.map((label, i) => {
        const isDone = i < 2;      // Browse and Cart are completed
        const isActive = i === 2;  // Checkout is active
        return (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 relative">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm
                  ${isDone ? 'bg-[#1D9E75] text-white' : isActive ? 'bg-[#534AB7] text-white' : 'bg-slate-200 text-slate-400'}`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span 
                className={`text-[11px] whitespace-nowrap absolute -bottom-5 left-1/2 -translate-x-1/2 font-medium
                  ${isDone ? 'text-[#1D9E75]' : isActive ? 'text-[#534AB7] font-semibold' : 'text-slate-400'}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-3 transition-colors duration-300
                  ${isDone ? 'bg-[#1D9E75]' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const CheckoutPage = () => {
  const { cartItems, cartSubtotal, cartTax, cartShipping, cartTotal, clearCart, clearPurchasedItems } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showSteps = location.state?.fromCart;

  const [shippingAddress, setShippingAddress] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: user?.addresses?.[0]?.addressLine1 || '',
    addressLine2: user?.addresses?.[0]?.addressLine2 || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    postalCode: user?.addresses?.[0]?.postalCode || ''
  }));
  
  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    setShippingAddress({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      addressLine1: user.addresses?.[0]?.addressLine1 || '',
      addressLine2: user.addresses?.[0]?.addressLine2 || '',
      city: user.addresses?.[0]?.city || '',
      state: user.addresses?.[0]?.state || '',
      postalCode: user.addresses?.[0]?.postalCode || ''
    });
  }

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [authLoading, isAuthenticated, cartItems.length, navigate]);

  const handleChange = (e) => {
    setPendingOrderId(null); // Invalidate pending order if shipping details change
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Load Razorpay script safely
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        return;
      }

      // 2. Reuse existing pending order or create a new internal order
      let internalOrderId = pendingOrderId;
      if (!internalOrderId) {
        const orderPayload = {
          orderItems: cartItems,
          shippingAddress,
          paymentInfo: {
            method: 'Razorpay',
            status: 'Pending'
          }
        };

        const { data: orderRes } = await api.post('/orders', orderPayload);
        const internalOrder = orderRes.order;
        internalOrderId = internalOrder._id;
        setPendingOrderId(internalOrderId);
      }

      // 3. Create or reuse Razorpay order via canonical endpoint
      const { data: rzpData } = await api.post('/payments/razorpay/create-order/', {
        orderId: internalOrderId
      });

      const razorpayOrderId = rzpData.orderId || rzpData.razorpayOrderId;
      const razorpayKey = rzpData.key || rzpData.keyId;

      // 4. Determine safe public HTTPS merchant logo URL (never localhost / HTTP / product image)
      let merchantLogoUrl;
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        const hostname = window.location.hostname.toLowerCase();
        const isLocal =
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '::1' ||
          hostname === '0.0.0.0' ||
          hostname.endsWith('.localhost');
        if (!isLocal && logo) {
          try {
            merchantLogoUrl = new URL(logo, window.location.origin).href;
          } catch {
            merchantLogoUrl = undefined;
          }
        }
      }

      // Configure Razorpay Standard Checkout options
      const options = {
        key: razorpayKey,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'AK Mobiles',
        ...(merchantLogoUrl ? { image: merchantLogoUrl } : {}),
        description: rzpData.description || `Order #${internalOrderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          contact: shippingAddress.phone
        },
        theme: {
          color: '#0F172A'
        },
        modal: {
          ondismiss: async function () {
            setIsProcessing(false);
            try {
              await api.post('/payments/razorpay/checkout-dismissed/', {
                internalOrderId: internalOrderId,
                razorpayOrderId: razorpayOrderId,
                orderId: internalOrderId
              });
            } catch (err) {
              console.warn('Failed to notify backend of checkout dismissal:', err);
            }
            toast('Payment cancelled. Your order was not placed.', { icon: 'ℹ️' });
          }
        },
        handler: async function (response) {
          try {
            // 5. Verify payment on server via canonical endpoint
            const { data: verifyRes } = await api.post('/payments/razorpay/verify-payment/', {
              orderId: internalOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            const isCompleted = verifyRes?.success === true && verifyRes?.payment?.status === 'Completed';
            const verifiedOrderId = verifyRes?.order?.id || verifyRes?.order?._id || verifyRes?.orderId;

            if (isCompleted && verifiedOrderId) {
              if (typeof clearPurchasedItems === 'function') {
                clearPurchasedItems(cartItems.map(item => item.product || item.id));
              } else {
                clearCart();
              }
              toast.success('Payment successful! Order placed.');
              navigate(`/orders/${verifiedOrderId}`, { replace: true });
            } else if (verifyRes?.status === 'authorized') {
              toast('Payment authorized and processing. We will update your order shortly.', { icon: '⏳' });
              navigate(`/orders/${verifiedOrderId || internalOrderId}`, { replace: true });
            } else {
              toast.error(verifyRes?.message || 'Payment status pending verification.');
              setIsProcessing(false);
            }
          } catch (error) {
            const msg = error.response?.data?.message || 'Payment verification failed. Please contact support.';
            toast.error(msg);
            setIsProcessing(false);
          }
        }
      };

      // 6. Open Razorpay modal
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        const errorDesc = response.error?.description || 'Payment failed. Please try again.';
        toast.error(`Payment failed: ${errorDesc}`);
        setIsProcessing(false);
      });
      
      paymentObject.open();
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Something went wrong initiating payment.';
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <PageSkeleton loading={true} statusText="Initializing checkout, please wait...">
        <CheckoutSkeleton />
      </PageSkeleton>
    );
  }

  if (cartItems.length === 0) return null;

  return (
    <>
      <Helmet>
        <title>Checkout | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-8 min-h-screen">
        <div className="container mx-auto px-4 max-w-6xl">
          {showSteps && <CheckoutStepBar />}
          
          <Link to="/cart" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-orange mb-6 transition-colors">
            <FiArrowLeft /> Back to Cart
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Forms */}
            <div className="lg:w-2/3">
              <form id="checkout-form" onSubmit={handlePayment} className="space-y-8">
                
                {/* Contact Info */}
                <Reveal className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm">1</span>
                    Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="name"
                        value={shippingAddress.name}
                        onChange={handleChange}
                        required
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        name="email"
                        value={shippingAddress.email}
                        onChange={handleChange}
                        required
                        className="input-field" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleChange}
                        required
                        className="input-field" 
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>
                </Reveal>

                {/* Shipping Info */}
                <Reveal delay={0.05} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm">2</span>
                    Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={handleChange}
                        required
                        className="input-field" 
                        placeholder="House No, Building Name, Street"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address Line 2</label>
                      <input 
                        type="text" 
                        name="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={handleChange}
                        className="input-field" 
                        placeholder="Landmark, Area (Optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">City <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleChange}
                        required
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">State <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleChange}
                        required
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">PIN Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleChange}
                        required
                        className="input-field" 
                      />
                    </div>
                  </div>
                </Reveal>
              </form>
            </div>

            {/* Right Column - Order Summary & Payment */}
            <div className="lg:w-1/3">
              <Reveal delay={0.1} className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-24 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pt-2 pr-2 custom-scrollbar">
                    {cartItems.map((item) => (
                      <div key={item.product} className="flex gap-3">
                        <div className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-md p-1 relative z-10">
                          <img src={getValidImageUrl(item.image, item.name)} alt={item.name} className="w-full h-full object-contain" />
                          <span className="absolute -top-1.5 -right-1.5 bg-[#534AB7] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm z-20">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p>
                          <p className="text-sm font-bold text-slate-500 mt-1">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST (Included)</span>
                      <span className="font-semibold text-slate-900">{formatPrice(cartTax)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-4">
                      <span>Delivery</span>
                      {cartShipping === 0 ? (
                        <span className="font-semibold text-green-600">Free</span>
                      ) : (
                        <span className="font-semibold text-slate-900">{formatPrice(cartShipping)}</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold text-slate-900">Total to Pay</span>
                      <span className="text-2xl font-bold text-[#534AB7]">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    form="checkout-form"
                    disabled={isProcessing}
                    className="w-full h-14 text-lg flex items-center justify-center gap-2 mb-4 bg-[#534AB7] hover:bg-[#433b9f] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#534AB7]/25 disabled:opacity-70 disabled:shadow-none"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </button>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Accepted Payments</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* UPI */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 h-9 shadow-sm select-none">
                        <span className="font-extrabold text-slate-700 text-sm tracking-tight">UPI</span>
                        <div className="flex gap-[1px] h-4 mx-0.5">
                          <div className="w-[3px] bg-[#E06626] rounded-full"></div>
                          <div className="w-[3px] bg-[#0F8A5F] rounded-full"></div>
                        </div>
                        <div className="flex flex-col text-[5.5px] leading-none font-semibold text-slate-400 uppercase">
                          <span>Unified Payments</span>
                          <span>Interface</span>
                        </div>
                      </div>

                      {/* GPay */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 h-9 shadow-sm select-none">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span className="font-bold text-slate-800 text-xs">GPay</span>
                      </div>

                      {/* PhonePe */}
                      <div className="flex items-center gap-1 bg-[#5f259f] text-white rounded-lg px-2.5 py-1 h-9 shadow-sm select-none">
                        <div className="bg-white rounded p-[1px] flex items-center justify-center w-4 h-4">
                          <span className="text-[#5f259f] font-black text-[10px]">P</span>
                        </div>
                        <span className="font-bold text-[11px] tracking-tight">PhonePe</span>
                      </div>

                      {/* Paytm */}
                      <div className="flex items-center justify-center bg-[#00b9f1] text-white rounded-lg px-3 py-1 h-9 shadow-sm select-none">
                        <span className="font-black text-xs italic tracking-tight text-white">paytm</span>
                      </div>

                      {/* VISA */}
                      <div className="flex items-center justify-center bg-white border border-slate-200 rounded-lg px-3 py-1 h-9 shadow-sm select-none">
                        <span className="font-black text-sm italic tracking-tight text-[#0F1C5F]">VISA</span>
                      </div>

                      {/* Mastercard */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 h-9 shadow-sm select-none">
                        <div className="flex -space-x-1">
                          <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-90"></div>
                          <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-90"></div>
                        </div>
                        <span className="font-bold text-slate-700 text-[9px] tracking-tight">mastercard</span>
                      </div>

                      {/* RuPay */}
                      <div className="flex items-center justify-center bg-white border border-slate-200 rounded-lg px-3 py-1 h-9 shadow-sm font-black italic text-xs select-none">
                        <span className="text-[#0B4A8F]">Ru</span>
                        <span className="text-[#A2C739]">Pay</span>
                      </div>

                      {/* Net Banking */}
                      <div className="flex items-center gap-1 bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D28D9] rounded-lg px-2 py-1 h-9 shadow-sm font-semibold text-[10px] select-none">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Net Banking</span>
                      </div>
                    </div>

                    {/* Security Info */}
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500 mt-3 leading-normal">
                      <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Secured &amp; powered by <strong className="font-semibold text-slate-700">Razorpay</strong> · SSL Encrypted · PCI DSS Compliant</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
