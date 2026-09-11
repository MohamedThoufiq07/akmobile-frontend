import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag, FiUsers, FiDollarSign, FiPackage, FiAlertCircle,
} from 'react-icons/fi';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import adminApi from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import { formatISTDateTime } from '../../utils/dateFormatter';
import { AdminDashboardSkeleton, PageSkeleton } from '../../components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem } from '../../components/ui/animations';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_STYLES = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Processing: 'bg-yellow-100 text-yellow-800',
  Placed: 'bg-slate-100 text-slate-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        const { data } = await adminApi.get('/admin/dashboard');
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(
          err.response?.data?.message ||
          'Could not load dashboard data. Please ensure you are logged in as an admin and the server is running.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const revenueSeries = useMemo(() => {
    if (!stats?.monthlyRevenue) return [];
    return stats.monthlyRevenue.map((m) => ({
      label: `${MONTHS[(m._id.month || 1) - 1]} ${m._id.year}`,
      revenue: m.revenue || 0,
      orders: m.orders || 0,
    }));
  }, [stats]);

  const recentOrders = stats?.recentOrders || [];
  const statusBreakdown = stats?.statusBreakdown || [];

  if (loading) {
    return (
      <PageSkeleton loading={true} statusText="Loading dashboard, please wait...">
        <AdminDashboardSkeleton />
      </PageSkeleton>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 flex items-start gap-3">
        <FiAlertCircle size={22} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Couldn't load dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards — REAL data */}
      <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <RevealItem className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-lg flex items-center justify-center shrink-0">
            <FiDollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">{formatPrice(stats?.totalRevenue || 0)}</p>
          </div>
        </RevealItem>

        <RevealItem className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <FiShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalOrders ?? 0}</p>
          </div>
        </RevealItem>

        <RevealItem>
          <Link to="/admin/products" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow h-full">
            <div className="w-14 h-14 bg-orange-50 text-brand-orange rounded-lg flex items-center justify-center shrink-0">
              <FiPackage size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Products</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalProducts ?? 0}</p>
            </div>
          </Link>
        </RevealItem>

        <RevealItem>
          <Link to="/admin/users" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow h-full">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center shrink-0">
              <FiUsers size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Customers</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalCustomers ?? 0}</p>
            </div>
          </Link>
        </RevealItem>
      </RevealStagger>

      {/* Revenue chart + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Reveal className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Revenue (last 12 months)</h2>
          {revenueSeries.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatPrice(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Reveal>

        <Reveal delay={0.1} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Orders by Status</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => (
                <div key={s._id} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[s._id] || 'bg-slate-100 text-slate-800'}`}>
                    {s._id}
                  </span>
                  <span className="text-lg font-bold text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      {/* Recent Orders */}
      <Reveal className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-brand-orange hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm font-mono text-slate-600 whitespace-nowrap">{order._id.substring(order._id.length - 8)}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 whitespace-nowrap">{order.user?.name || order.shippingAddress?.name || 'Guest'}</td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatISTDateTime(order.createdAt)}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[order.orderStatus] || 'bg-slate-100 text-slate-800'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-900 whitespace-nowrap">{formatPrice(order.totalPrice)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No recent orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Reveal>
    </>
  );
};

export default AdminDashboard;
