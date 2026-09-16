import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiDownload, FiCheck, FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiInfo, FiRefreshCw, FiAlertTriangle, FiShoppingBag } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/useAuth';
import { formatPrice } from '../utils/formatPrice';
import { formatISTDateTime } from '../utils/dateFormatter';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { OrderDetailSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const maskPaymentId = (pid) => {
  if (!pid || typeof pid !== 'string') return '';
  if (pid.length <= 10) return pid;
  return `${pid.slice(0, 4)}...${pid.slice(-4)}`;
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/orders/${id}`)}`);
    }
  }, [authLoading, isAuthenticated, id, navigate]);

  const fetchOrder = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setError(null);
    } catch (err) {
      if (!isBackground) {
        setError(err.response?.data?.message || 'Error fetching order details');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    window.scrollTo(0, 0);

    api.get(`/orders/${id}`)
      .then(({ data }) => {
        if (!ignore) {
          setOrder(data.order);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.response?.data?.message || 'Error fetching order details');
          setLoading(false);
        }
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      setOrder((currentOrder) => {
        if (currentOrder && (currentOrder.orderStatus === 'Delivered' || currentOrder.orderStatus === 'Cancelled')) {
          clearInterval(intervalId);
          return currentOrder;
        }
        fetchOrder(true);
        return currentOrder;
      });
    }, 30000);

    return () => {
      ignore = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [id, fetchOrder]);

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

  const handleRetryPayment = async () => {
    if (isRetrying || !order) return;
    setIsRetrying(true);

    try {
      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        toast.error('Razorpay SDK failed to load. Please check your connection.');
        setIsRetrying(false);
        return;
      }

      // 1. Call authenticated backend create-order endpoint
      const { data: rzpData } = await api.post('/payments/razorpay/create-order/', {
        orderId: order._id
      });

      let merchantLogoUrl;
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        const hostname = window.location.hostname.toLowerCase();
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        if (!isLocal && logo) {
          try {
            merchantLogoUrl = new URL(logo, window.location.origin).href;
          } catch {
            merchantLogoUrl = undefined;
          }
        }
      }

      const ship = order.shippingAddress || {};

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'AK Mobiles',
        ...(merchantLogoUrl ? { image: merchantLogoUrl } : {}),
        description: rzpData.description || `Order #${order._id}`,
        order_id: rzpData.orderId,
        prefill: {
          name: ship.name || order.user?.name || '',
          email: ship.email || order.user?.email || '',
          contact: ship.phone || ''
        },
        theme: {
          color: '#0F172A'
        },
        modal: {
          ondismiss: async function () {
            setIsRetrying(false);
            try {
              await api.post('/payments/razorpay/checkout-dismissed/', {
                orderId: order._id
              });
            } catch (err) {
              console.warn('Failed to notify backend of checkout dismissal:', err);
            }
            toast('Payment cancelled. You can retry anytime.', { icon: 'ℹ️' });
            fetchOrder();
          }
        },
        handler: async function (response) {
          try {
            const { data: verifyRes } = await api.post('/payments/razorpay/verify-payment/', {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.status === 'captured') {
              toast.success('Payment successful! Order confirmed.');
              fetchOrder();
            } else {
              toast(verifyRes.message || 'Payment processing...', { icon: '⏳' });
              fetchOrder();
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsRetrying(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error?.description || 'Please try again.'}`);
        setIsRetrying(false);
      });
      paymentObject.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment retry.');
      setIsRetrying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    const paymentInfo = order.paymentInfo || {};
    const isCompleted = paymentInfo.status === 'Completed' && order.orderStatus !== 'AwaitingPayment';

    if (!isCompleted) {
      toast.error('Invoice is available only after payment is completed.');
      return;
    }

    setIsDownloading(true);
    try {
      // First try to fetch official backend PDF
      const response = await api.get(`/orders/${order._id}/invoice`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Invoice_${order._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      // Fallback to client-side jsPDF if server PDF generation is unavailable
      if (err.response?.status === 409 || err.response?.status === 403) {
        toast.error(err.response?.data?.message || 'Invoice unavailable.');
      } else {
        generateClientInvoiceFallback();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const generateClientInvoiceFallback = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(24, 58, 95);
      doc.text('AK MOBILES', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Main Road, Near Bus Stand, Virudhachalam, TN - 606001', 14, 27);
      doc.text('Payment Receipt', 150, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Order ID: ${order._id}`, 14, 40);
      doc.text(`Date: ${formatISTDateTime(order.createdAt)}`, 14, 46);
      
      doc.text('Bill To:', 14, 60);
      doc.setFontSize(10);
      const ship = order.shippingAddress || {};
      const shipName = ship.name || order.user?.name || 'Customer';
      doc.text(shipName, 14, 66);
      
      let nextY = 72;
      if (ship.addressLine1) {
        doc.text(ship.addressLine1, 14, nextY);
        nextY += 6;
      }
      if (ship.addressLine2) {
        doc.text(ship.addressLine2, 14, nextY);
        nextY += 6;
      }
      if (ship.city || ship.state || ship.postalCode) {
        doc.text(`${ship.city || ''}, ${ship.state || ''} - ${ship.postalCode || ''}`, 14, nextY);
        nextY += 6;
      }
      if (ship.phone) {
        doc.text(`Phone: ${ship.phone}`, 14, nextY);
        nextY += 6;
      }

      const tableColumn = ["Item", "Brand", "Qty", "Price", "Total"];
      const tableRows = [];
      const items = Array.isArray(order.orderItems) ? order.orderItems : [];

      items.forEach(item => {
        const itemData = [
          item.name || 'Product',
          item.product?.brand || item.brand || 'N/A',
          (item.quantity || 1).toString(),
          `Rs. ${Number(item.price || 0).toLocaleString('en-IN')}`,
          `Rs. ${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}`
        ];
        tableRows.push(itemData);
      });

      doc.autoTable({
        startY: Math.max(nextY + 4, 95),
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [24, 58, 95] }
      });

      const finalY = (doc.lastAutoTable?.finalY || 140) + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal: Rs. ${Number(order.itemsPrice || 0).toLocaleString('en-IN')}`, 130, finalY);
      doc.text(`GST (Included): Rs. ${Number(order.taxPrice || 0).toLocaleString('en-IN')}`, 130, finalY + 7);
      doc.text(`Shipping: Rs. ${Number(order.shippingPrice || 0).toLocaleString('en-IN')}`, 130, finalY + 14);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Paid: Rs. ${Number(order.totalPrice || 0).toLocaleString('en-IN')}`, 130, finalY + 24);
      
      doc.save(`Invoice_${order._id}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Invoice fallback error:', err);
      toast.error('Failed to generate invoice.');
    }
  };

  if (loading) {
    return (
      <PageSkeleton loading={true} statusText="Loading order details, please wait...">
        <OrderDetailSkeleton />
      </PageSkeleton>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-5xl mb-4 text-red-500"><FiInfo /></div>
        <h2 className="text-2xl font-bold mb-2">{error || 'Order not found'}</h2>
        <p className="text-slate-500 mb-6 max-w-sm">We could not load the details for this order. It may belong to another account or have been removed.</p>
        <div className="flex gap-4">
          <button onClick={() => fetchOrder(false)} className="btn-outline flex items-center gap-2">
            <FiRefreshCw /> Try Again
          </button>
          <Link to="/my-orders" className="btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const paymentInfo = order.paymentInfo || {};
  const isPaid = paymentInfo.status === 'Completed' && order.orderStatus !== 'AwaitingPayment';
  const isCancelled = order.orderStatus === 'Cancelled';
  const paymentStatus = paymentInfo.status || 'Pending';

  const getStepStatus = (stepName) => {
    if (!isPaid) return 'pending';
    const statusOrder = ['Placed', 'Processing', 'Shipped', 'Delivered'];
    
    if (order.orderStatus === 'Cancelled') {
      return stepName === 'Placed' ? 'completed' : 'cancelled';
    }

    const currentIndex = statusOrder.indexOf(order.orderStatus);
    const stepIndex = statusOrder.indexOf(stepName);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const steps = [
    { name: 'Placed', icon: FiCheck, label: 'Order Placed' },
    { name: 'Processing', icon: FiPackage, label: 'Processing' },
    { name: 'Shipped', icon: FiTruck, label: 'Shipped' },
    { name: 'Delivered', icon: FiMapPin, label: 'Delivered' }
  ];

  const ship = order.shippingAddress || {};
  const shipName = ship.name || order.user?.name || 'Customer';
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const maskedTxnId = maskPaymentId(paymentInfo.razorpayPaymentId);

  return (
    <>
      <Helmet>
        <title>Order Details | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-10 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Top Actions Bar */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <Link to="/my-orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-orange transition-colors font-medium text-sm">
              <FiArrowLeft /> Back to Orders
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/products" className="text-sm font-semibold text-brand-orange hover:underline inline-flex items-center gap-1.5">
                <FiShoppingBag /> Continue Shopping
              </Link>
              {isPaid && (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  title="Download Official Invoice PDF"
                  className="btn-outline py-2 px-4 text-sm flex items-center gap-2 bg-white shadow-sm"
                >
                  <FiDownload /> {isDownloading ? 'Downloading...' : 'Download Invoice'}
                </button>
              )}
            </div>
          </div>

          {/* Success Banner when order is confirmed / paid */}
          {isPaid && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 mb-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <FiCheckCircle size={26} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Order Placed Successfully</h2>
                  <p className="text-sm text-emerald-100 mt-0.5">Thank you for your purchase from AK Mobiles.</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">Order Number</span>
                <p className="font-mono font-bold text-base text-white">{order._id}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Column - Main Details */}
            <div className="lg:w-2/3 space-y-6">
              
              {/* Order Status & Timeline */}
              <Reveal className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex flex-wrap justify-between items-end mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Order Details</h1>
                    <p className="text-sm font-mono text-slate-500">ID: {order._id}</p>
                  </div>
                  <div className="text-right mt-4 sm:mt-0">
                    <p className="text-sm text-slate-500 mb-1">Created on</p>
                    <p className="font-semibold text-slate-900">
                      {formatISTDateTime(order.createdAt, 'Recently')}
                    </p>
                  </div>
                </div>

                {/* Timeline & Unpaid Banner */}
                <div className="relative pt-2 pb-6 overflow-hidden">
                  {isCancelled ? (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl font-semibold flex items-center justify-center gap-2">
                      <FiInfo size={20} /> Order Cancelled
                    </div>
                  ) : !isPaid ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={22} />
                        <div>
                          <p className="font-bold text-sm">Payment Confirmation Required</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            This order is currently unconfirmed. Delivery tracking will activate automatically once payment is completed.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRetryPayment}
                        disabled={isRetrying}
                        className="btn-primary py-2 px-5 text-sm font-bold shrink-0 shadow-md"
                      >
                        {isRetrying ? 'Opening Gateway...' : 'Retry Payment'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between relative px-2 sm:px-4">
                        <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 z-0"></div>
                        <div 
                          className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all duration-500"
                          style={{ 
                            width: order.orderStatus === 'Placed' ? '0%' : 
                                   order.orderStatus === 'Processing' ? '33%' : 
                                   order.orderStatus === 'Shipped' ? '66%' : '100%' 
                          }}
                        ></div>

                        {steps.map((step) => {
                          const status = getStepStatus(step.name);
                          const Icon = step.icon;
                          
                          return (
                            <div key={step.name} className="relative z-10 flex flex-col items-center group">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-colors
                                ${status === 'completed' ? 'bg-green-500 text-white' : 
                                  status === 'current' ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-400'}`}
                              >
                                <Icon size={18} />
                              </div>
                              <p className={`text-xs sm:text-sm font-medium mt-3 text-center
                                ${status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}
                              >
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Real Tracking Info Placeholder (Shiprocket structure) */}
                      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                        <FiTruck className="text-slate-400 shrink-0" size={16} />
                        <span>Tracking details will be available once your order is shipped.</span>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>

              {/* Items List */}
              <Reveal delay={0.05} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Items in Order</h3>
                
                <div className="space-y-6">
                  {items.map((item, index) => {
                    const productId = item.product?._id || item.product || '';
                    const itemName = item.name || 'Product';
                    const itemBrand = item.product?.brand || item.brand || '';
                    const itemPrice = Number(item.price || 0);
                    const itemQty = Number(item.quantity || 1);

                    return (
                      <div key={index} className="flex gap-4 items-center pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 border border-slate-100 shrink-0">
                          <img src={getValidImageUrl(item.image, itemName)} alt={itemName} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <Link to={`/products/${productId}`} className="font-bold text-slate-900 hover:text-brand-orange text-base line-clamp-2 mb-1">
                            {itemName}
                          </Link>
                          {itemBrand && <p className="text-xs text-slate-500 uppercase">{itemBrand}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900">{formatPrice(itemPrice)}</p>
                          <p className="text-sm text-slate-500">Qty: {itemQty}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Reveal>

            </div>

            {/* Right Column - Summary & Shipping */}
            <div className="lg:w-1/3 space-y-6">

              {/* Payment Summary */}
              <Reveal delay={0.1} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Payment Summary</h3>
                
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatPrice(order.itemsPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Included)</span>
                    <span className="font-medium text-slate-900">{formatPrice(order.taxPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-4">
                    <span>Delivery</span>
                    <span className="font-medium text-slate-900">{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-slate-900">{isPaid ? 'Total Paid' : 'Amount Due'}</span>
                    <span className={`text-xl font-bold ${isPaid ? 'text-brand-orange' : 'text-rose-600'}`}>
                      {formatPrice(order.totalPrice || 0)}
                    </span>
                  </div>
                </div>

                {/* Payment State Panel */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Payment Details</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900">Method</span>
                    <span className="text-sm text-slate-700 font-medium">Razorpay (Online)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900">Status</span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <FiCheckCircle size={12} /> Paid
                      </span>
                    ) : paymentStatus === 'Cancelled' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                        <FiInfo size={12} /> Cancelled
                      </span>
                    ) : paymentStatus === 'Failed' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                        <FiAlertTriangle size={12} /> Failed
                      </span>
                    ) : paymentStatus === 'Expired' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  {maskedTxnId && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-xs text-slate-500">Txn ID</span>
                      <span className="text-xs text-slate-700 font-mono">{maskedTxnId}</span>
                    </div>
                  )}

                  {!isPaid && !isCancelled && (
                    <button
                      onClick={handleRetryPayment}
                      disabled={isRetrying}
                      className="w-full mt-3 btn-primary py-2 text-xs font-bold shadow-sm"
                    >
                      {isRetrying ? 'Opening Gateway...' : 'Retry Payment'}
                    </button>
                  )}
                </div>
              </Reveal>

              {/* Shipping Address */}
              <Reveal delay={0.15} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Delivery Information</h3>
                
                <p className="font-bold text-slate-900 mb-1">{shipName}</p>
                {ship.phone && <p className="text-sm text-slate-600 mb-4">{ship.phone}</p>}
                
                <div className="text-sm text-slate-600 leading-relaxed">
                  {ship.addressLine1 && <p>{ship.addressLine1}</p>}
                  {ship.addressLine2 && <p>{ship.addressLine2}</p>}
                  {(ship.city || ship.state) && <p>{ship.city || ''}{ship.city && ship.state ? ', ' : ''}{ship.state || ''}</p>}
                  {ship.postalCode && <p className="font-medium mt-1">PIN: {ship.postalCode}</p>}
                </div>
              </Reveal>

            </div>
          </div>

          {/* Bottom Navigation & Actions */}
          <div className="mt-8 flex flex-wrap gap-4 items-center justify-between bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary py-2.5 px-5 text-sm font-semibold flex items-center gap-2">
                <FiShoppingBag /> Continue Shopping
              </Link>
              <Link to="/my-orders" className="btn-outline py-2.5 px-5 text-sm font-semibold flex items-center gap-2 bg-white">
                <FiPackage /> View All Orders
              </Link>
            </div>
            {isPaid && (
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="btn-outline py-2.5 px-5 text-sm font-semibold flex items-center gap-2 bg-white text-slate-700 hover:text-brand-orange"
              >
                <FiDownload /> {isDownloading ? 'Downloading...' : 'Download Invoice'}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;
