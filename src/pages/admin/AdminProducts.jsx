import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiStar,
  FiRotateCcw,
  FiArchive,
} from 'react-icons/fi';
import adminApi from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';
import { formatErrorMessage } from '../../utils/formatError';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { Reveal } from '../../components/ui/animations';
import { getPrimaryProductImageUrl } from '../../utils/imageHelper';
import { TableSkeleton, PageSkeleton } from '../../components/ui/skeleton';
import { useConfirm } from '../../context/useConfirm';
import { useNotification } from '../../context/useNotification';

const AdminProducts = () => {
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllFilteredSelected, setIsAllFilteredSelected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { confirm } = useConfirm();
  const notify = useNotification();
  const headerCheckboxRef = useRef(null);

  // Fetch products based on tab, page, and search
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: tab === 'archived' ? 'archived' : 'active',
      });
      if (search) params.set('search', search);

      const { data } = await adminApi.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, notify]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setSelectedIds([]);
      setIsAllFilteredSelected(false);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '12',
          status: tab === 'archived' ? 'archived' : 'active',
        });
        if (search) params.set('search', search);

        const { data } = await adminApi.get(`/products?${params.toString()}`);
        if (!ignore) {
          setProducts(data.products || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          notify.error(formatErrorMessage(err, 'Failed to load products'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [page, search, tab, notify]);

  // Header checkbox indeterminate calculation
  const visibleIds = products.map((p) => p._id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const isAllVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const isSomeVisibleSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeVisibleSelected;
    }
  }, [isSomeVisibleSelected]);

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected || isAllFilteredSelected) {
      setSelectedIds([]);
      setIsAllFilteredSelected(false);
    } else {
      setSelectedIds([...visibleIds]);
      setIsAllFilteredSelected(false);
    }
  };

  const handleToggleSelectRow = (id) => {
    setIsAllFilteredSelected(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setIsAllFilteredSelected(true);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setIsAllFilteredSelected(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleTabChange = (newTab) => {
    if (tab === newTab) return;
    setTab(newTab);
    setPage(1);
    setSelectedIds([]);
    setIsAllFilteredSelected(false);
  };

  // Single Product Archive (Soft delete)
  const handleArchiveSingle = async (product) => {
    const confirmed = await confirm({
      title: `Archive "${product.name}"?`,
      message:
        'This product will be removed from the storefront immediately.\nHistorical orders and payment records will remain safe.',
      confirmText: 'Archive Product',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await adminApi.delete(`/products/${product._id}`);
      notify.success(`"${product.name}" archived successfully`);
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Failed to archive product'));
    }
  };

  // Single Product Restore
  const handleRestoreSingle = async (product) => {
    const confirmed = await confirm({
      title: `Restore "${product.name}"?`,
      message: 'This product will be restored to the storefront immediately.',
      confirmText: 'Restore Product',
      cancelText: 'Cancel',
      variant: 'success',
    });
    if (!confirmed) return;

    try {
      await adminApi.put(`/products/${product._id}/restore`);
      notify.success(`"${product.name}" restored successfully`);
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Failed to restore product'));
    }
  };

  // Bulk Archive Action
  const handleBulkArchive = async () => {
    const count = isAllFilteredSelected ? total : selectedIds.length;
    if (count === 0) return;

    const confirmed = await confirm({
      title: isAllFilteredSelected
        ? `Archive all ${total} matching products?`
        : `Archive ${count} selected product${count === 1 ? '' : 's'}?`,
      message:
        'These products will be removed from the storefront immediately.\nHistorical orders and payment records will remain safe.',
      confirmText: `Archive ${count} Product${count === 1 ? '' : 's'}`,
      cancelText: 'Cancel',
      variant: 'danger',
      confirmationKeyword: isAllFilteredSelected ? 'DELETE' : '',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const payload = isAllFilteredSelected
        ? {
            selection_mode: 'all_filtered',
            filters: { search },
            excluded_ids: [],
          }
        : { product_ids: selectedIds };

      const { data } = await adminApi.post('/products/bulk-archive', payload);
      notify.success(data.message || `${data.archived_count || count} products archived.`);
      handleClearSelection();
      fetchProducts();
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Bulk archive failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Restore Action
  const handleBulkRestore = async () => {
    const count = isAllFilteredSelected ? total : selectedIds.length;
    if (count === 0) return;

    const confirmed = await confirm({
      title: isAllFilteredSelected
        ? `Restore all ${total} matching products?`
        : `Restore ${count} selected product${count === 1 ? '' : 's'}?`,
      message: 'These products will be restored to the active storefront immediately.',
      confirmText: `Restore ${count} Product${count === 1 ? '' : 's'}`,
      cancelText: 'Cancel',
      variant: 'success',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const payload = isAllFilteredSelected
        ? {
            selection_mode: 'all_filtered',
            filters: { search },
            excluded_ids: [],
          }
        : { product_ids: selectedIds };

      const { data } = await adminApi.post('/products/bulk-restore', payload);
      notify.success(data.message || `${data.restored_count || count} products restored.`);
      handleClearSelection();
      fetchProducts();
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Bulk restore failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };
  const onSaved = () => {
    setModalOpen(false);
    setEditing(null);
    fetchProducts();
  };

  const isSelectionActive = selectedIds.length > 0 || isAllFilteredSelected;

  return (
    <>
      {/* Tabs & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => handleTabChange('active')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Products
          </button>
          <button
            onClick={() => handleTabChange('archived')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              tab === 'archived'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiArchive size={15} />
            <span>Trash / Archived</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue w-full sm:w-60 bg-white"
            />
          </form>

          {tab === 'active' && (
            <button
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orangeHover text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-orange-200"
            >
              <FiPlus /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Select All Across Pages Banner */}
      {isAllVisibleSelected && total > products.length && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-blue-900 animate-fadeIn">
          <div>
            {!isAllFilteredSelected ? (
              <span>
                All <strong>{products.length}</strong> products on this page are selected.{' '}
                <button
                  onClick={handleSelectAllFiltered}
                  className="font-bold underline text-blue-700 hover:text-blue-900 ml-1 cursor-pointer"
                >
                  Select all {total} matching products
                </button>
              </span>
            ) : (
              <span>
                All <strong>{total}</strong> matching products are selected across all pages.
              </span>
            )}
          </div>
          <button
            onClick={handleClearSelection}
            className="text-blue-700 hover:text-blue-900 font-medium underline shrink-0 ml-3"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Main Table or Skeleton */}
      {loading ? (
        <PageSkeleton label="Loading products table">
          <TableSkeleton rows={8} cols={6} />
        </PageSkeleton>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          {tab === 'archived'
            ? 'No archived products in Trash.'
            : `No active products found${search ? ` for "${search}"` : ''}.`}
        </div>
      ) : (
        <Reveal className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 w-12 text-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={isAllVisibleSelected || isAllFilteredSelected}
                      onChange={handleToggleSelectAllVisible}
                      aria-label="Select all visible products"
                      className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Brand</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Stock</th>
                  {tab === 'active' ? (
                    <th className="p-4 font-semibold">Featured</th>
                  ) : (
                    <th className="p-4 font-semibold">Archived Details</th>
                  )}
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isSelected = isAllFilteredSelected || selectedIds.includes(p._id);
                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(p._id)}
                          aria-label={`Select ${p.name}`}
                          className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-1 shrink-0">
                            <img
                              src={getPrimaryProductImageUrl(p)}
                              alt={p.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.visibility = 'hidden';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate max-w-[220px]">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {p.category} {p.deliveryCharge && `• Delivery ₹${p.deliveryCharge}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{p.brand}</td>

                      {/* Price */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-slate-900">{formatPrice(p.offerPrice)}</p>
                        {p.originalPrice > p.offerPrice && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatPrice(p.originalPrice)}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-4 text-sm whitespace-nowrap">
                        <span className={p.stock > 0 ? 'text-slate-700' : 'text-red-600 font-semibold'}>
                          {p.stock > 0 ? p.stock : 'Out of stock'}
                        </span>
                      </td>

                      {/* Featured / Archived Details */}
                      {tab === 'active' ? (
                        <td className="p-4">
                          {p.isFeatured ? (
                            <FiStar className="text-brand-orange fill-brand-orange" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ) : (
                        <td className="p-4 text-xs text-slate-500">
                          <div>
                            <span>
                              {p.archivedAt
                                ? new Date(p.archivedAt).toLocaleDateString()
                                : 'Archived'}
                            </span>
                            {p.archivedBy && (
                              <p className="text-slate-400 truncate max-w-[150px]">
                                by {p.archivedBy.name || p.archivedBy.email}
                              </p>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {tab === 'active' ? (
                            <>
                              <button
                                onClick={() => openEdit(p)}
                                className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Product"
                                aria-label={`Edit ${p.name}`}
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleArchiveSingle(p)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Archive Product"
                                aria-label={`Archive ${p.name}`}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestoreSingle(p)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Restore Product"
                                aria-label={`Restore ${p.name}`}
                              >
                                <FiRotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => openEdit(p)}
                                className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Product"
                                aria-label={`Edit ${p.name}`}
                              >
                                <FiEdit2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Sticky Bulk Action Bar */}
      {isSelectionActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-4 max-w-lg w-[92%] sm:w-auto animate-fadeIn">
          <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
            {isAllFilteredSelected ? (
              <span>All <strong>{total}</strong> products selected</span>
            ) : (
              <span>
                <strong>{selectedIds.length}</strong> product{selectedIds.length === 1 ? '' : 's'} selected
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
            {tab === 'active' ? (
              <button
                disabled={actionLoading}
                onClick={handleBulkArchive}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-900 disabled:opacity-50"
              >
                <FiTrash2 size={14} />
                <span>Archive Selected</span>
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={handleBulkRestore}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-900 disabled:opacity-50"
              >
                <FiRotateCcw size={14} />
                <span>Restore Selected</span>
              </button>
            )}

            <button
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs sm:text-sm rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {modalOpen && (
        <ProductFormModal product={editing} onClose={() => setModalOpen(false)} onSaved={onSaved} />
      )}
    </>
  );
};

export default AdminProducts;
