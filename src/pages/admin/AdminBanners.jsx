import { useState, useEffect } from 'react';
import {
  FiImage, FiPlus, FiTrash2, FiEdit2, FiSave, FiEye, FiEyeOff,
  FiArrowUp, FiArrowDown, FiUpload, FiLink, FiX, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { useConfirm } from '../../context/useConfirm';
import { useNotification } from '../../context/useNotification';
import { Reveal, RevealStagger, RevealItem } from '../../components/ui/animations';
import { AdminBannersSkeleton, PageSkeleton } from '../../components/ui/skeleton';
import bannerSmartphones from '../../assets/banners/banner-smartphones.png';
import bannerLaptops from '../../assets/banners/banner-laptops.png';
import bannerAccessories from '../../assets/banners/banner-accessories.png';
import bannerAirpods from '../../assets/banners/banner-airpods.png';

const DEFAULT_BANNER_PRESETS = [
  { id: 'b-1', image: bannerSmartphones, link: '/products?category=Smartphones', alt: 'Up to 50% Off on Premium Smartphones', active: true },
  { id: 'b-2', image: bannerLaptops, link: '/products', alt: 'Up to 45% Off on Premium Laptops', active: true },
  { id: 'b-3', image: bannerAccessories, link: '/products?category=Accessories', alt: 'Up to 60% Off on Premium Accessories', active: true },
  { id: 'b-4', image: bannerAirpods, link: '/products?category=Earbuds', alt: 'Up to 20% Off on AirPods & Earbuds', active: true },
];

const PREDEFINED_LINKS = [
  { label: 'Smartphones', url: '/products?category=Smartphones' },
  { label: 'Laptops', url: '/products' },
  { label: 'Accessories', url: '/products?category=Accessories' },
  { label: 'Earbuds', url: '/products?category=Earbuds' },
  { label: 'Smart Watches', url: '/products?category=Smart%20Watches' },
];

const generateBannerId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `banner-${crypto.randomUUID()}`;
  }
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
};

const AdminBanners = () => {
  const { confirm } = useConfirm();
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state for Add/Edit
  const [form, setForm] = useState({
    id: '',
    title: '',
    image: '',
    link: '/products',
    active: true,
  });


  useEffect(() => {
    let ignore = false;
    adminApi.get('/settings')
      .then(({ data }) => {
        if (!ignore) {
          const savedBanners = data.settings?.banners;
          if (Array.isArray(savedBanners) && savedBanners.length > 0) {
            setBanners(savedBanners);
          } else {
            setBanners(DEFAULT_BANNER_PRESETS);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(err.response?.data?.message || 'Failed to load banners configuration');
          setBanners(DEFAULT_BANNER_PRESETS);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const saveBannersToBackend = async (newList) => {
    setSaving(true);
    try {
      await adminApi.put('/settings', { banners: newList });
      setBanners(newList);
      toast.success('Banner CMS settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update banners');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setForm({
      id: generateBannerId(),
      title: '',
      image: '',
      link: '/products',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setForm({
      id: banner.id || banner._id || generateBannerId(),
      title: banner.title || banner.alt || '',
      image: banner.image || '',
      link: banner.link || '/products',
      active: banner.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await adminApi.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success && res.data.url) {
        setForm((prev) => ({ ...prev, image: res.data.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Image upload failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!form.image) {
      toast.error('Please upload an image or provide an image URL.');
      return;
    }

    let newList;
    if (editingBanner) {
      newList = banners.map((b) =>
        (b.id || b._id) === form.id ? { ...b, ...form, alt: form.title || form.alt } : b
      );
    } else {
      newList = [...banners, { ...form, alt: form.title }];
    }

    saveBannersToBackend(newList);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (banners.length <= 1) {
      notify.error('You must keep at least 1 hero banner.');
      return;
    }
    const confirmed = await confirm({
      title: 'Delete Hero Banner?',
      message: 'Are you sure you want to delete this hero banner slide?',
      confirmText: 'Delete Banner',
      variant: 'danger',
    });
    if (confirmed) {
      const newList = banners.filter((b) => (b.id || b._id) !== id);
      saveBannersToBackend(newList);
    }
  };

  const handleToggleActive = (id) => {
    const newList = banners.map((b) => {
      const bId = b.id || b._id;
      if (bId === id) {
        return { ...b, active: !b.active };
      }
      return b;
    });
    saveBannersToBackend(newList);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const newList = [...banners];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    saveBannersToBackend(newList);
  };

  const handleResetToDefaults = async () => {
    const confirmed = await confirm({
      title: 'Reset Banners to Default?',
      message: 'This will reset hero banners to default pre-designed slides.',
      confirmText: 'Reset Banners',
      variant: 'warning',
    });
    if (confirmed) {
      saveBannersToBackend(DEFAULT_BANNER_PRESETS);
    }
  };

  if (loading) {
    return (
      <PageSkeleton label="Loading banners manager">
        <AdminBannersSkeleton count={4} />
      </PageSkeleton>
    );
  }

  const activeCount = banners.filter((b) => b.active !== false).length;

  return (
    <div className="space-y-6">
      {/* Header bar & stats */}
      <Reveal className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xl mb-1">
            <FiImage className="text-blue-600" />
            <h2>Homepage Hero Banners CMS</h2>
          </div>
          <p className="text-sm text-slate-500">
            Manage full-width promotional banners displayed on the storefront main slider.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            title="Reset to original preset banners"
          >
            <FiRefreshCw size={14} /> Reset Presets
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <FiPlus size={16} /> Add New Banner
          </button>
        </div>
      </Reveal>

      {/* Overview Cards */}
      <RevealStagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RevealItem className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Banners</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{banners.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            {banners.length}
          </div>
        </RevealItem>

        <RevealItem className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Banners</p>
            <p className="text-2xl font-black text-green-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <FiEye />
          </div>
        </RevealItem>

        <RevealItem className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hidden Banners</p>
            <p className="text-2xl font-black text-slate-400 mt-1">{banners.length - activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <FiEyeOff />
          </div>
        </RevealItem>
      </RevealStagger>

      {/* Banners List */}
      <Reveal className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">Active Slide Sequence</h3>
          <span className="text-xs text-slate-500 font-medium">Re-order using ↑ and ↓ buttons</span>
        </div>

        <div className="divide-y divide-slate-100">
          {banners.map((banner, index) => {
            const bId = banner.id || banner._id || `idx-${index}`;
            const isActive = banner.active !== false;

            return (
              <div
                key={bId}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  !isActive ? 'bg-slate-50/70 opacity-75' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Image preview & info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative w-36 sm:w-48 aspect-[21/9] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={banner.image}
                      alt={banner.title || banner.alt || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x350?text=Invalid+Banner+Image+URL';
                      }}
                    />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {banner.title || banner.alt || `Hero Banner #${index + 1}`}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <FiLink className="shrink-0 text-blue-500" />
                      <span className="font-mono text-slate-600 truncate">{banner.link || '/products'}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Order controls */}
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || saving}
                    className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <FiArrowUp size={16} />
                  </button>

                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === banners.length - 1 || saving}
                    className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <FiArrowDown size={16} />
                  </button>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(bId)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isActive ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    <span className="hidden sm:inline">{isActive ? 'Hide' : 'Show'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(banner)}
                    className="p-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit banner"
                  >
                    <FiEdit2 size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(bId)}
                    className="p-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete banner"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {banners.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <FiImage size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No banners configured yet.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                <FiPlus /> Add First Banner
              </button>
            </div>
          )}
        </div>
      </Reveal>

      {/* Modal for Add / Edit Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FiImage className="text-blue-600" />
                {editingBanner ? 'Edit Banner' : 'Add New Hero Banner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Image <span className="text-red-500">*</span>
                </label>

                {form.image && (
                  <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-3">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <FiUpload size={14} />
                    {uploadingImage ? 'Uploading...' : 'Upload File'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title / Alt Text
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Up to 50% Off on Premium Smartphones"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Link Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Click Destination Link
                </label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/products?category=Smartphones"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs mb-2"
                />

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Shortcuts:</span>
                  {PREDEFINED_LINKS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, link: preset.url })}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[11px] font-medium transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Active (show this slide in storefront carousel)
                </span>
              </label>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  <FiSave size={14} /> Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
