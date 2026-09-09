import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiDownload, FiCheck, FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiInfo, FiRefreshCw } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Reveal } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';
import toast from 'react-hot-toast';

const maskPaymentId = (pid) => {
  if (!pid || typeof pid !== 'string') return '';
  if (pid.length <= 10) return pid;
  return `${pid.slice(0, 4)}...${pid.slice(-4)}`;
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = async (isBackground = false) => {
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
  };

  useEffect(() => {
    fetchOrder();
    window.scrollTo(0, 0);

    // Refetch when tab/page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll backend every 30s while order is non-terminal (not Delivered / Cancelled)
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [id]);

  const generateInvoice = () => {
    if (!order) return;

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(24, 58, 95); // Brand Blue
      doc.text('AK MOBILES', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Main Road, Near Bus Stand, Virudhachalam, TN - 606001', 14, 27);
      doc.text('Payment Receipt', 150, 20);
      
      // Order Info
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Order ID: ${order._id}`, 14, 40);
      doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}`, 14, 46);
      
      // Customer Info
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

      // Table
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
      
      // Totals
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
      console.error('Invoice generation failed:', err);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

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

  // Determine active step in timeline
  const getStepStatus = (stepName) => {
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
  const paymentInfo = order.paymentInfo || {};
  const maskedTxnId = maskPaymentId(paymentInfo.razorpayPaymentId);

  return (
    <>
      <Helmet>
        <title>Order Details | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-10 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <Link to="/my-orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-orange transition-colors">
              <FiArrowLeft /> Back to Orders
            </Link>

            <button
              onClick={generateInvoice}
              className="btn-outline py-2 px-4 text-sm flex items-center gap-2 bg-white"
            >
              <FiDownload /> Download Invoice
            </button>
          </div>
          
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
                    <p className="text-sm text-slate-500 mb-1">Placed on</p>
                    <p className="font-semibold text-slate-900">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                          })
                        : 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative pt-4 pb-8 overflow-hidden">
                  {order.orderStatus === 'Cancelled' ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <FiInfo size={20} /> Order Cancelled
                    </div>
                  ) : (
                    <div className="flex justify-between relative px-2 sm:px-4">
                      {/* Line behind steps */}
                      <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 z-0"></div>
                      
                      {/* Active Line */}
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
                    <span className="font-bold text-slate-900">Total Paid</span>
                    <span className="text-xl font-bold text-brand-orange">{formatPrice(order.totalPrice || 0)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-slate-900">Razorpay (Online)</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FiCheckCircle /> Payment {paymentInfo.status || 'Completed'}
                  </p>
                  {maskedTxnId && (
                    <p className="text-xs text-slate-400 mt-1 font-mono break-all">Txn ID: {maskedTxnId}</p>
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
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;
