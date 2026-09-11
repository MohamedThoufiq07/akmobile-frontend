import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCheckCircle, FiPackage, FiFileText } from 'react-icons/fi';
import api from '../utils/api';
import { Reveal } from '../components/ui/animations';
import { PageSkeleton, Skeleton, SkeletonCircle } from '../components/ui/skeleton';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        if (!ignore) {
          setOrder(data.order);
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Error fetching order:', error);
          setLoading(false);
        }
      }
    };

    fetchOrder();
    window.scrollTo(0, 0);
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageSkeleton label="Loading order confirmation">
        <div className="bg-slate-50 min-h-[80vh] py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <SkeletonCircle size="w-20 h-20" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="border-t border-b border-slate-100 py-6 space-y-3 flex flex-col items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-48 font-mono" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-5 w-56" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Skeleton className="h-11 w-44 rounded-xl" />
                <Skeleton className="h-11 w-44 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </PageSkeleton>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order Successful | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 min-h-[80vh] py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Reveal y={16} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 sm:p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <FiCheckCircle size={48} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Order Successfully Placed!</h1>
              <p className="text-green-50">Thank you for your purchase from AK Mobiles.</p>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8 pb-8 border-b border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Order ID</p>
                <p className="text-xl font-mono font-bold text-slate-900">{order._id}</p>
                
                <p className="text-sm text-slate-500 mt-4 mb-1">Expected Delivery</p>
                <p className="font-semibold text-slate-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={`/orders/${order._id}`} className="btn-outline flex items-center justify-center gap-2">
                  <FiFileText /> View Order Details
                </Link>
                <Link to="/products" className="btn-primary flex items-center justify-center gap-2">
                  <FiPackage /> Continue Shopping
                </Link>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
              <p className="text-sm text-slate-500">
                A confirmation email has been sent to <span className="font-semibold text-slate-700">{order.shippingAddress.email}</span>
              </p>
            </div>

          </Reveal>
        </div>
      </div>
    </>
  );
};

export default OrderSuccessPage;
