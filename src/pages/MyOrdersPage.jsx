import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiEye, FiPackage, FiSearch } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { STATUS_COLORS } from '../utils/constants';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        setOrders(data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <Helmet>
        <title>My Orders | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-10 min-h-[80vh]">
        <div className="container mx-auto px-4 max-w-6xl">
          <Reveal as="h1" className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">My Orders</Reveal>

          {loading ? (
            <LoadingSpinner />
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiPackage size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders found</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">You haven't placed any orders yet. Start exploring our products and find something you love!</p>
              <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                <FiSearch /> Browse Products
              </Link>
            </div>
          ) : (
            <RevealStagger className="space-y-6">
              {orders.map((order) => (
                <RevealItem key={order._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Order Placed</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Amount</p>
                        <p className="text-sm font-medium text-slate-900">{formatPrice(order.totalPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Ship To</p>
                        <p className="text-sm font-medium text-slate-900">{order.shippingAddress.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end w-full sm:w-auto">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1 sm:hidden">Order ID</p>
                      <p className="text-sm font-mono text-slate-600 mb-2">Order # {order._id.substring(order._id.length - 8).toUpperCase()}</p>
                      <Link 
                        to={`/orders/${order._id}`}
                        className="btn-outline py-1.5 px-4 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        <FiEye /> View Details
                      </Link>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1 w-full">
                      <div className="mb-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order.orderStatus] || 'bg-slate-100 text-slate-800'}`}>
                          {order.orderStatus}
                        </span>
                        {order.orderStatus === 'Delivered' && order.deliveredAt ? (
                          <span className="text-sm text-slate-500 ml-3">
                            Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                          </span>
                        ) : order.orderStatus !== 'Cancelled' ? (
                          <span className="text-sm text-slate-500 ml-3">
                            Expected {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        {order.orderItems.map((item, index) => (
                          <div key={index} className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                              <img src={getValidImageUrl(item.image, item.name)} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <Link to={`/products/${item.product._id || item.product}`} className="font-semibold text-slate-900 hover:text-brand-orange text-sm line-clamp-1">
                                {item.name}
                              </Link>
                              <p className="text-sm text-slate-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </div>
      </div>
    </>
  );
};

export default MyOrdersPage;
