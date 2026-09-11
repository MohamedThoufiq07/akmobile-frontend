import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { Reveal } from '../../components/ui/animations';
import { getPrimaryProductImageUrl } from '../../utils/imageHelper';
import { TableSkeleton, PageSkeleton } from '../../components/ui/skeleton';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      const { data } = await adminApi.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (search) params.set('search', search);

    adminApi.get(`/products?${params.toString()}`)
      .then(({ data }) => {
        if (!ignore) {
          setProducts(data.products || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(err.response?.data?.message || 'Failed to load products');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/products/${product._id}`);
      toast.success('Product deleted');
      // If we just deleted the last item on a page, step back a page
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (product) => { setEditing(product); setModalOpen(true); };
  const onSaved = () => { setModalOpen(false); setEditing(null); fetchProducts(); };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-slate-500">{total} product{total === 1 ? '' : 's'} total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue w-full sm:w-56"
            />
          </form>
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orangeHover text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap">
            <FiPlus /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <PageSkeleton label="Loading products table">
          <TableSkeleton rows={8} cols={6} />
        </PageSkeleton>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          No products found{search ? ` for "${search}"` : ''}.
        </div>
      ) : (
        <Reveal className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Brand</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">Featured</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-1 shrink-0">
                          <img src={getPrimaryProductImageUrl(p)} alt={p.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate max-w-[220px]">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.category} {p.deliveryCharge && `• Delivery ₹${p.deliveryCharge}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{p.brand}</td>
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-900">{formatPrice(p.offerPrice)}</p>
                      {p.originalPrice > p.offerPrice && (
                        <p className="text-xs text-slate-400 line-through">{formatPrice(p.originalPrice)}</p>
                      )}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className={p.stock > 0 ? 'text-slate-700' : 'text-red-600 font-semibold'}>
                        {p.stock > 0 ? p.stock : 'Out of stock'}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.isFeatured ? <FiStar className="text-brand-orange fill-brand-orange" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg" title="Edit"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(p)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white">Next</button>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal product={editing} onClose={() => setModalOpen(false)} onSaved={onSaved} />
      )}
    </>
  );
};

export default AdminProducts;
