import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiDownload, FiCheck, FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiInfo } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Reveal } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    window.scrollTo(0, 0);
  }, [id]);

  const generateInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(24, 58, 95); // Brand Blue
    doc.text('AK MOBILES', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Main Road, Near Bus Stand, Virudhachalam, TN - 606001', 14, 27);
    doc.text('Tax Invoice', 170, 20);
    
    // Order Info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ID: ${order._id}`, 14, 40);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 14, 46);
    
    // Customer Info
    doc.text('Bill To:', 14, 60);
    doc.setFontSize(10);
    doc.text(order.shippingAddress.name, 14, 66);
    doc.text(order.shippingAddress.addressLine1, 14, 72);
    if (order.shippingAddress.addressLine2) {
      doc.text(order.shippingAddress.addressLine2, 14, 78);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 14, 84);
    } else {
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 14, 78);
    }
    doc.text(`Phone: ${order.shippingAddress.phone}`, 14, order.shippingAddress.addressLine2 ? 90 : 84);

    // Table
    const tableColumn = ["Item", "Brand", "Qty", "Price", "Total"];
    const tableRows = [];

    order.orderItems.forEach(item => {
      const itemData = [
        item.name,
        item.product?.brand || 'N/A',
        item.quantity.toString(),
        `Rs. ${item.price.toLocaleString('en-IN')}`,
        `Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      startY: 100,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [24, 58, 95] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Totals
    doc.text(`Subtotal: Rs. ${order.itemsPrice.toLocaleString('en-IN')}`, 130, finalY);
    doc.text(`GST (Included): Rs. ${order.taxPrice.toLocaleString('en-IN')}`, 130, finalY + 7);
    doc.text(`Shipping: Rs. ${order.shippingPrice.toLocaleString('en-IN')}`, 130, finalY + 14);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: Rs. ${order.totalPrice.toLocaleString('en-IN')}`, 130, finalY + 24);
    
    doc.save(`Invoice_${order._id}.pdf`);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-5xl mb-4 text-red-500"><FiInfo /></div>
        <h2 className="text-2xl font-bold mb-4">{error || 'Order not found'}</h2>
        <Link to="/my-orders" className="btn-primary">Back to Orders</Link>
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
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
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

                      {steps.map((step, index) => {
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
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 border border-slate-100 shrink-0">
                        <img src={getValidImageUrl(item.image, item.name)} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <Link to={`/products/${item.product._id || item.product}`} className="font-bold text-slate-900 hover:text-brand-orange text-base line-clamp-2 mb-1">
                          {item.name}
                        </Link>
                        {item.product?.brand && <p className="text-xs text-slate-500 uppercase">{item.product.brand}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{formatPrice(item.price)}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
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
                    <span className="font-medium text-slate-900">{formatPrice(order.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Included)</span>
                    <span className="font-medium text-slate-900">{formatPrice(order.taxPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-4">
                    <span>Delivery</span>
                    <span className="font-medium text-slate-900">{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-slate-900">Total Paid</span>
                    <span className="text-xl font-bold text-brand-orange">{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-slate-900">Razorpay (Online)</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FiCheckCircle /> Payment {order.paymentInfo?.status || 'Completed'}
                  </p>
                  {order.paymentInfo?.razorpayPaymentId && (
                    <p className="text-xs text-slate-400 mt-1 font-mono break-all">Txn ID: {order.paymentInfo.razorpayPaymentId}</p>
                  )}
                </div>
              </Reveal>

              {/* Shipping Address */}
              <Reveal delay={0.15} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Delivery Information</h3>
                
                <p className="font-bold text-slate-900 mb-1">{order.shippingAddress.name}</p>
                <p className="text-sm text-slate-600 mb-4">{order.shippingAddress.phone}</p>
                
                <div className="text-sm text-slate-600 leading-relaxed">
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  <p className="font-medium mt-1">PIN: {order.shippingAddress.postalCode}</p>
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
