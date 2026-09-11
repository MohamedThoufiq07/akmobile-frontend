import { useState, useEffect, useMemo } from 'react';
import { FiZap, FiSearch, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import { Reveal } from '../../components/ui/animations';
import { TableSkeleton, PageSkeleton } from '../../components/ui/skeleton';

// ISO date -> value for <input type="datetime-local">
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminFlashSale = () => {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const [form, setForm] = useState({
    flashSaleActive: false,
    flashSaleTitle: '',
    flashSaleSubtitle: '',
    flashSaleEndsAt: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          adminApi.get('/settings'),
          adminApi.get('/products?limit=200'),
        ]);
        const s = settingsRes.data.settings || {};
        setForm({
          flashSaleActive: s.flashSaleActive || false,
          flashSaleTitle: s.flashSaleTitle || 'Flash Sale',
          flashSaleSubtitle: s.flashSaleSubtitle || '',
          flashSaleEndsAt: toLocalInput(s.flashSaleEndsAt),
        });
        setProducts(productsRes.data.products || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load flash sale data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saleCount = useMemo(() => products.filter((p) => p.flashSale).length, [products]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [products, search]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        flashSaleActive: form.flashSaleActive,
        flashSaleTitle: form.flashSaleTitle,
        flashSaleSubtitle: form.flashSaleSubtitle,
        flashSaleEndsAt: form.flashSaleEndsAt ? new Date(form.flashSaleEndsAt).toISOString() : null,
      };
      await adminApi.put('/settings', payload);
      toast.success('Flash sale settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleProduct = async (product) => {
    const next = !product.flashSale;
    setTogglingId(product._id);
    try {
      await adminApi.put(`/products/${product._id}`, { flashSale: next });
      setProducts((list) => list.map((p) => (p._id === product._id ? { ...p, flashSale: next } : p)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <PageSkeleton label="Loading flash sale manager">
        <TableSkeleton rows={8} cols={4} />
      </PageSkeleton>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <Reveal as="form" onSubmit={saveSettings} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FiZap className="text-brand-orange" />
          <h2 className="text-lg font-bold text-slate-900">Flash Sale Settings</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 sm:col-span-2 bg-slate-50 rounded-lg px-4 py-3">
            <input type="checkbox" checked={form.flashSaleActive} onChange={(e) => set('flashSaleActive', e.target.checked)} className="w-5 h-5" />
            <span className="text-sm font-semibold text-slate-700">
              Flash sale is {form.flashSaleActive ? 'ACTIVE' : 'inactive'} on the storefront
            </span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.flashSaleTitle} onChange={(e) => set('flashSaleTitle', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Countdown Ends At</label>
            <input type="datetime-local" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.flashSaleEndsAt} onChange={(e) => set('flashSaleEndsAt', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.flashSaleSubtitle} onChange={(e) => set('flashSaleSubtitle', e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-500"><span className="font-bold text-slate-800">{saleCount}</span> product{saleCount === 1 ? '' : 's'} in the flash sale</p>
          <button type="submit" disabled={savingSettings} className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-60">
            <FiSave size={16} /> {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </Reveal>

      {/* Product picker */}
      <Reveal className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Choose Flash Sale Products</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {filtered.map((p) => (
            <div key={p._id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
              <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-1 shrink-0">
                <img src={p.images?.[0]?.url} alt={p.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.brand} · {formatPrice(p.offerPrice)}</p>
              </div>
              <button
                onClick={() => toggleProduct(p)}
                disabled={togglingId === p._id}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${p.flashSale ? 'bg-brand-orange' : 'bg-slate-300'}`}
                title={p.flashSale ? 'Remove from flash sale' : 'Add to flash sale'}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${p.flashSale ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-slate-500 text-sm">No products match "{search}".</p>
          )}
        </div>
      </Reveal>
    </div>
  );
};

export default AdminFlashSale;
