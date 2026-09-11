import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiEye, FiPackage, FiSearch, FiRefreshCw, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/useAuth';
import { formatPrice } from '../utils/formatPrice';
import { STATUS_COLORS } from '../utils/constants';
import { formatISTDateTime, formatISTDateOnly } from '../utils/dateFormatter';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';
import { OrderCardSkeleton, PageSkeleton } from '../components/ui/skeleton';


const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/orders/myorders');
      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setOrders(orderList);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Unable to load orders. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.get('/orders/myorders')
      .then(({ data }) => {
        if (!ignore) {
          const orderList = Array.isArray(data)
            ? data
            : Array.isArray(data?.orders)
            ? data.orders
            : Array.isArray(data?.results)
            ? data.results
            : [];
          setOrders(orderList);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Error fetching orders:', err);
          setError(err.response?.data?.message || 'Unable to load orders. Please check your connection and try again.');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>My Orders | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-10 min-h-[80vh]">
        <div className="container mx-auto px-4 max-w-6xl">
          <Reveal as="h1" className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            My Orders
          </Reveal>

          {loading ? (
            <PageSkeleton loading={true} statusText="Loading your orders...">
              <div className="space-y-6" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
            </PageSkeleton>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle size={40} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Unable to load orders</h2>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchOrders}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiRefreshCw /> Try Again
              </button>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiPackage size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders found</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                You haven't placed any orders yet. Start exploring our products and find something you love!
              </p>
              <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                <FiSearch /> Browse Products
              </Link>
            </div>
          ) : (
            <RevealStagger className="space-y-6">
              {orders.map((order, idx) => {
                if (!order || typeof order !== 'object') return null;

                const orderId = order._id || '';
                const shortId = orderId ? (orderId.length > 8 ? orderId.slice(-8) : orderId).toUpperCase() : 'UNKNOWN';
                const shipName = order.shippingAddress?.name || user?.name || 'Customer';
                const items = Array.isArray(order.orderItems) ? order.orderItems : [];
                const orderStatus = order.orderStatus || 'Placed';
                const paymentInfo = order.paymentInfo || {};
                const isPaid = paymentInfo.status === 'Completed' && orderStatus !== 'AwaitingPayment';

                let displayBadgeText = orderStatus;
                let displayBadgeColor = STATUS_COLORS[orderStatus] || 'bg-slate-100 text-slate-800';

                if (!isPaid) {
                  if (paymentInfo.status === 'Cancelled') {
                    displayBadgeText = 'Payment Cancelled';
                    displayBadgeColor = STATUS_COLORS['Payment Cancelled'];
                  } else if (paymentInfo.status === 'Failed') {
                    displayBadgeText = 'Payment Failed';
                    displayBadgeColor = STATUS_COLORS['Payment Failed'];
                  } else if (paymentInfo.status === 'Expired') {
                    displayBadgeText = 'Payment Expired';
                    displayBadgeColor = STATUS_COLORS['Payment Expired'];
                  } else {
                    displayBadgeText = 'Awaiting Payment';
                    displayBadgeColor = STATUS_COLORS['Awaiting Payment'];
                  }
                }

                return (
                  <RevealItem key={orderId || `order-${idx}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-2">
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Created</p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatISTDateTime(order.createdAt, 'Recently')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                            {isPaid ? 'Total Amount' : 'Amount Due'}
                          </p>
                          <p className={`text-sm font-bold ${isPaid ? 'text-slate-900' : 'text-rose-600'}`}>
                            {formatPrice(order.totalPrice || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Ship To</p>
                          <p className="text-sm font-medium text-slate-900">{shipName}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end w-full sm:w-auto">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1 sm:hidden">Order ID</p>
                        <p className="text-sm font-mono text-slate-600 mb-2">Order # {shortId}</p>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {!isPaid && orderStatus !== 'Cancelled' && (
                            <Link
                              to={`/orders/${orderId}`}
                              className="btn-primary py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-bold shadow-sm"
                            >
                              Retry Payment <FiArrowRight size={12} />
                            </Link>
                          )}
                          <Link
                            to={`/orders/${orderId}`}
                            className="btn-outline py-1.5 px-4 text-sm flex items-center justify-center gap-2 w-full sm:w-auto bg-white"
                          >
                            <FiEye /> View Details
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start gap-6">
                      <div className="flex-1 w-full">
                        <div className="mb-4 flex items-center flex-wrap gap-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${displayBadgeColor}`}>
                            {displayBadgeText}
                          </span>
                          {isPaid && orderStatus === 'Delivered' && order.deliveredAt ? (
                            <span className="text-sm text-slate-500 ml-2">
                              Delivered on {formatISTDateTime(order.deliveredAt)}
                            </span>
                          ) : isPaid && orderStatus !== 'Cancelled' ? (
                            <span className="text-sm text-slate-500 ml-2">
                              Expected {order.estimatedDelivery ? formatISTDateOnly(order.estimatedDelivery) : '5-7 business days'}
                            </span>
                          ) : !isPaid ? (
                            <span className="text-sm text-amber-700 font-medium ml-2">
                              Payment pending confirmation
                            </span>
                          ) : null}
                        </div>

                        <div className="space-y-4">
                          {items.map((item, index) => {
                            const productId = item.product?._id || item.product || '';
                            const itemName = item.name || 'Product';
                            const itemPrice = Number(item.price || 0);
                            const itemQty = Number(item.quantity || 1);

                            return (
                              <div key={index} className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                                  <img src={getValidImageUrl(item.image, itemName)} alt={itemName} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <Link to={`/products/${productId}`} className="font-semibold text-slate-900 hover:text-brand-orange text-sm line-clamp-1">
                                    {itemName}
                                  </Link>
                                  <p className="text-sm text-slate-500 mt-1">
                                    Qty: {itemQty} × {formatPrice(itemPrice)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </RevealItem>
                );
              })}
            </RevealStagger>
          )}
        </div>
      </div>
    </>
  );
};

export default MyOrdersPage;
