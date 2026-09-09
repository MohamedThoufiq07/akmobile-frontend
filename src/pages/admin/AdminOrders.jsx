import { useState, useEffect, useCallback } from 'react';
import { FiEye, FiX, FiCheckCircle, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import { STATUS_COLORS } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Reveal } from '../../components/ui/animations';

const STATUSES = ['AwaitingPayment', 'Placed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'];

const OrderDetailModal = ({ order, onClose }) => {
  const paymentInfo = order.paymentInfo || {};
  const isPaid = paymentInfo.status === 'Completed';

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Order #{order._id.slice(-8)}</h2>
            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiX /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment Status</p>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isPaid ? <FiCheckCircle size={12} /> : <FiInfo size={12} />}
                {paymentInfo.status || 'Pending'}
              </span>
              {paymentInfo.razorpayPaymentId && (
                <p className="text-[11px] text-slate-500 font-mono mt-1">Txn: {paymentInfo.razorpayPaymentId}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Fulfilment Status</p>
              <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.orderStatus] || 'bg-slate-100 text-slate-800'}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Customer & shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</p>
              <p className="font-medium text-slate-900">{order.user?.name || order.shippingAddress?.name}</p>
              <p className="text-slate-600">{order.user?.email || order.shippingAddress?.email}</p>
              <p className="text-slate-600">{order.shippingAddress?.phone}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Shipping Address</p>
              <p className="text-slate-700">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p className="text-slate-700">{order.shippingAddress.addressLine2}</p>}
              <p className="text-slate-700">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Items</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {(order.orderItems || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 bg-slate-50 rounded border border-slate-100 p-1 shrink-0">
                    <img src={it.image} alt={it.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{it.name}</p>
                    <p className="text-xs text-slate-500">Qty: {it.quantity} × {formatPrice(it.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatPrice(it.price * it.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="text-sm space-y-1 max-w-xs ml-auto">
            <div className="flex justify-between text-slate-600"><span>Items</span><span>{formatPrice(order.itemsPrice)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatPrice(order.taxPrice)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'Free'}</span></div>
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
              <span>{isPaid ? 'Total Paid' : 'Amount Due'}</span>
              <span className={isPaid ? 'text-slate-900' : 'text-rose-600'}>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Status History</p>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[h.status] || 'bg-slate-100 text-slate-800'}`}>{h.status}</span>
                    <span className="text-slate-500">{new Date(h.date).toLocaleString()}</span>
                    {h.description && <span className="text-slate-400 text-xs">— {h.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await adminApi.get(`/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-500">{total} order{total === 1 ? '' : 's'} total</p>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
        >
          <option value="">All Fulfilment Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">No orders found.</div>
      ) : (
        <Reveal className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold">Payment Status</th>
                  <th className="p-4 font-semibold">Fulfilment Status</th>
                  <th className="p-4 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const paymentInfo = order.paymentInfo || {};
                  const isPaid = paymentInfo.status === 'Completed';

                  return (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm font-mono text-slate-600 whitespace-nowrap">{order._id.slice(-8)}</td>
                      <td className="p-4 text-sm whitespace-nowrap">
                        <p className="font-medium text-slate-900">{order.user?.name || order.shippingAddress?.name || 'Guest'}</p>
                        <p className="text-xs text-slate-400">{order.user?.email || order.shippingAddress?.email}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 whitespace-nowrap">{formatPrice(order.totalPrice)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-1 ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {paymentInfo.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-1 ${STATUS_COLORS[order.orderStatus] || 'bg-slate-100 text-slate-800'}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setViewing(order)} className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg" title="View details"><FiEye size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Next</button>
        </div>
      )}

      {viewing && <OrderDetailModal order={viewing} onClose={() => setViewing(null)} />}
    </>
  );
};

export default AdminOrders;
