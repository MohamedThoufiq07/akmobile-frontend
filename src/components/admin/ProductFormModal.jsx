import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiTrash2, FiUploadCloud, FiStar, FiArrowUp, FiArrowDown, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminApi from '../../utils/adminApi';
import { BRANDS, CATEGORIES } from '../../utils/constants';
import { getPlaceholderSvg } from '../../utils/imageHelper';

const SPEC_FIELDS = [
  ['processor', 'Processor'], ['ram', 'RAM'], ['storage', 'Storage'],
  ['display', 'Display'], ['camera', 'Camera'], ['battery', 'Battery'],
  ['os', 'OS'], ['connectivity', 'Connectivity'], ['weight', 'Weight'], ['colors', 'Colors'],
];

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const blankFromProduct = (p) => {
  const existingImages = (p?.images || []).map((img, idx) => {
    const url = typeof img === 'string' ? img : img.url;
    const isPrimary = typeof img === 'object' ? Boolean(img.isPrimary || img.is_primary || idx === 0) : idx === 0;
    let nameFromUrl = '';
    if (url) {
      try {
        const cleanUrl = url.split('?')[0];
        const parts = cleanUrl.split('/');
        nameFromUrl = parts[parts.length - 1];
      } catch {
        // fallback
      }
    }
    return {
      id: img.id || img._id || `existing-${idx}`,
      url: url || '',
      storageKey: img.storageKey || img.storage_key || '',
      filename: img.filename || nameFromUrl || img.altText || img.alt || `image-${idx + 1}.jpg`,
      fileSize: img.fileSize || 0,
      previewUrl: url || '',
      status: 'success', // 'pending' | 'uploading' | 'success' | 'error'
      progress: 100,
      isPrimary,
      isNew: false,
    };
  });

  return {
    name: p?.name || '',
    brand: p?.brand || '',
    category: p?.category || 'Smartphones',
    description: p?.description || '',
    originalPrice: p?.originalPrice ?? '',
    offerPrice: p?.offerPrice ?? '',
    deliveryCharge: p?.deliveryCharge ?? (p?.delivery_charge ? String(p.delivery_charge) : '49.00'),
    stock: p?.stock ?? '',
    isFeatured: p?.isFeatured || false,
    flashSale: p?.flashSale || false,
    highlights: (p?.highlights || []).join('\n'),
    specs: SPEC_FIELDS.reduce((acc, [k]) => ({ ...acc, [k]: p?.specifications?.[k] || '' }), {}),
    images: existingImages,
  };
};

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

const ProductFormModal = ({ product, onClose, onSaved }) => {
  const isEdit = Boolean(product?._id || product?.id);
  const [form, setForm] = useState(() => blankFromProduct(product));
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const set = (key, value) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setSpec = (key, value) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
  };

  // Obtain or reuse upload session
  const getUploadSession = useCallback(async () => {
    if (sessionTokenRef.current) return sessionTokenRef.current;
    try {
      const { data } = await adminApi.post('/products/upload-session', {
        productId: product?._id,
      });
      if (data.token) {
        sessionTokenRef.current = data.token;
        return data.token;
      }
    } catch {
      // Fallback
    }
    return null;
  }, [product?._id]);

  // Clean up object URLs on unmount
  useEffect(() => {
    const imagesToClean = form.images;
    return () => {
      imagesToClean.forEach((img) => {
        if (img.previewUrl && img.isNew && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [form.images]);

  // Warn before leaving if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUploading = form.images.some((i) => i.status === 'uploading');
      if (isDirty || hasUploading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, form.images]);

  // Upload a single file
  const uploadFile = async (imgId, file) => {
    try {
      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? { ...i, status: 'uploading', progress: 30 } : i)),
      }));

      const sessionToken = await getUploadSession();
      const endpoint = sessionToken ? `/products/upload-session/${sessionToken}/stage` : '/upload';

      const fd = new FormData();
      fd.append('image', file);

      const { data } = await adminApi.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setForm((f) => ({
              ...f,
              images: f.images.map((i) => (i.id === imgId ? { ...i, progress: percent } : i)),
            }));
          }
        },
      });

      const url = data.url || data.item?.url;
      const storageKey = data.storage_key || data.item?.storageKey || '';

      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? {
          ...i,
          url,
          storageKey,
          status: 'success',
          progress: 100,
        } : i)),
      }));
      setIsDirty(true);
    } catch (err) {
      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? {
          ...i,
          status: 'error',
          errorMessage: err.response?.data?.message || 'Upload failed',
        } : i)),
      }));
      toast.error(err.response?.data?.message || `Failed to upload ${file.name}`);
    }
  };

  // Handle file selection
  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;

    const currentCount = form.images.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum limit of ${MAX_IMAGES} images reached.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast(`Added ${remainingSlots} images (maximum ${MAX_IMAGES} images allowed).`, { icon: 'ℹ️' });
    }

    const newImageEntries = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not supported. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large (max 5MB).`);
        continue;
      }

      const tempId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      const isFirstEver = currentCount === 0 && newImageEntries.length === 0;

      const entry = {
        id: tempId,
        url: '',
        storageKey: '',
        filename: file.name,
        fileSize: file.size,
        previewUrl,
        file,
        status: 'pending',
        progress: 0,
        isPrimary: isFirstEver,
        isNew: true,
      };

      newImageEntries.push(entry);
    }

    if (newImageEntries.length === 0) return;

    setForm((f) => {
      const updated = [...f.images, ...newImageEntries];
      // Guarantee exactly one primary
      const hasPrimary = updated.some((img) => img.isPrimary);
      if (!hasPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return { ...f, images: updated };
    });
    setIsDirty(true);

    // Trigger uploads
    newImageEntries.forEach((entry) => {
      uploadFile(entry.id, entry.file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    setIsDirty(true);
    setForm((f) => {
      const target = f.images[index];
      if (target?.previewUrl && target.isNew && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = f.images.filter((_, idx) => idx !== index);
      if (target?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return { ...f, images: updated };
    });
  };

  const setAsPrimary = (index) => {
    setIsDirty(true);
    setForm((f) => {
      const selected = f.images[index];
      if (!selected) return f;
      const remaining = f.images.filter((_, idx) => idx !== index);
      const reordered = [{ ...selected, isPrimary: true }, ...remaining.map((i) => ({ ...i, isPrimary: false }))];
      return { ...f, images: reordered };
    });
    toast.success('Primary image updated');
  };

  const moveImage = (index, direction) => {
    setIsDirty(true);
    setForm((f) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= f.images.length) return f;
      const copy = [...f.images];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      // Position 0 is always marked primary
      return {
        ...f,
        images: copy.map((img, idx) => ({ ...img, isPrimary: idx === 0 })),
      };
    });
  };

  const retryUpload = (img) => {
    if (img.file) {
      uploadFile(img.id, img.file);
    }
  };

  const original = Number(form.originalPrice) || 0;
  const offer = Number(form.offerPrice) || 0;
  const discount = original > 0 && offer <= original ? Math.round(((original - offer) / original) * 100) : 0;
  const deliveryVal = parseFloat(form.deliveryCharge);
  const validDelivery = isNaN(deliveryVal) || deliveryVal < 0 ? '49.00' : deliveryVal.toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.brand.trim() || !form.category.trim()) {
      toast.error('Name, brand and category are required.');
      return;
    }
    if (original <= 0 || offer <= 0) {
      toast.error('Please enter valid prices.');
      return;
    }
    if (offer > original) {
      toast.error('Offer price cannot be higher than the original price.');
      return;
    }

    const hasUploading = form.images.some((i) => i.status === 'uploading');
    if (hasUploading) {
      toast.error('Please wait for all image uploads to complete.');
      return;
    }

    const hasErrors = form.images.some((i) => i.status === 'error');
    if (hasErrors) {
      toast.error('Some images failed to upload. Please retry or remove them.');
      return;
    }

    // Build payload images list
    const preparedImages = form.images
      .filter((img) => img.status === 'success' && img.url)
      .map((img, idx) => ({
        id: img.isNew ? undefined : img.id,
        url: img.url,
        storageKey: img.storageKey,
        altText: form.name.trim(),
        sortOrder: idx,
        isPrimary: idx === 0,
      }));

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      originalPrice: original,
      offerPrice: offer,
      deliveryCharge: validDelivery,
      stock: Number(form.stock) || 0,
      discount,
      isFeatured: form.isFeatured,
      flashSale: form.flashSale,
      highlights: form.highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      specifications: form.specs,
      images: preparedImages,
      uploadSessionToken: sessionTokenRef.current || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.put(`/products/${product._id || product.id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await adminApi.post('/products', payload);
        toast.success('Product created successfully');
      }
      setIsDirty(false);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const isUploadInProgress = form.images.some((i) => i.status === 'uploading');

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <p className="text-xs text-slate-500">Enter product details, upload photos, and set delivery charge</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiX size={20} /></button>
        </div>

        {/* Body */}
        <form id="product-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. iPhone 15 Pro Max" required />
            </div>
            <div>
              <label className={labelCls}>Brand *</label>
              <input className={inputCls} list="brand-list" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Brand" required />
              <datalist id="brand-list">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <input className={inputCls} list="cat-list" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Category" required />
              <datalist id="cat-list">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short product description" />
            </div>
          </div>

          {/* Pricing, Delivery & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className={labelCls}>Original Price (₹) *</label>
              <input type="number" min="0" step="0.01" className={inputCls} value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Offer Price (₹) *</label>
              <input type="number" min="0" step="0.01" className={inputCls} value={form.offerPrice} onChange={(e) => set('offerPrice', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="deliveryCharge" className={labelCls}>Delivery Charge (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputCls} pl-6`}
                  value={form.deliveryCharge}
                  onChange={(e) => set('deliveryCharge', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Enter 0 for free delivery</p>
            </div>
            <div>
              <label className={labelCls}>Discount</label>
              <input className={`${inputCls} bg-slate-100 font-bold text-emerald-600`} value={`${discount}%`} readOnly />
            </div>
            <div>
              <label className={labelCls}>Stock *</label>
              <input type="number" min="0" className={inputCls} value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4 rounded text-brand-blue" />
              Featured product (shown on homepage)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.flashSale} onChange={(e) => set('flashSale', e.target.checked)} className="w-4 h-4 rounded text-brand-blue" />
              Include in Flash Sale ⚡
            </label>
          </div>

          {/* Multiple Product Images Upload Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-800">
                  Product Images ({form.images.length}/{MAX_IMAGES})
                </label>
                <p className="text-xs text-slate-500">
                  Drag &amp; drop or select multiple photos (front, back, sides, box). The 1st image is the primary image.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                JPEG, PNG, WebP · Max 5MB
              </span>
            </div>

            {/* Drag & Drop Area */}
            {form.images.length < MAX_IMAGES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-blue bg-blue-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = ''; // allow re-selecting same files
                  }}
                />
                <FiUploadCloud className="mx-auto text-brand-blue mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700">
                  Drag &amp; drop product photos here, or <span className="text-brand-blue underline">Browse Files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Select up to {MAX_IMAGES - form.images.length} more images</p>
              </div>
            )}

            {/* Image Preview Cards List */}
            {form.images.length > 0 && (
              <div className="space-y-2 mt-3">
                {form.images.map((img, idx) => {
                  const isPrimary = idx === 0 || img.isPrimary;
                  return (
                    <div
                      key={img.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isPrimary
                          ? 'border-[#534AB7] bg-pink-50/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={img.previewUrl || img.url || getPlaceholderSvg(form.name)}
                          alt={img.filename}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getPlaceholderSvg(form.name);
                          }}
                        />
                        {isPrimary && (
                          <span className="absolute top-0.5 right-0.5 bg-[#534AB7] text-white p-0.5 rounded-full shadow-xs">
                            <FiStar size={10} className="fill-white" />
                          </span>
                        )}
                      </div>

                      {/* File Info & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate" title={img.filename}>
                            {img.filename}
                          </p>
                          {isPrimary && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-100 text-[#534AB7] rounded">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{formatFileSize(img.fileSize)}</span>
                          <span>•</span>
                          {img.status === 'uploading' && (
                            <span className="text-blue-600 font-medium">Uploading... {img.progress}%</span>
                          )}
                          {img.status === 'success' && (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <FiCheckCircle size={12} /> Ready
                            </span>
                          )}
                          {img.status === 'error' && (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                              <FiAlertCircle size={12} /> {img.errorMessage || 'Failed'}
                            </span>
                          )}
                        </div>

                        {/* Upload Progress Bar */}
                        {img.status === 'uploading' && (
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-brand-blue h-full transition-all duration-200"
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {img.status === 'error' && (
                          <button
                            type="button"
                            onClick={() => retryUpload(img)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Retry
                          </button>
                        )}

                        {!isPrimary && img.status === 'success' && (
                          <button
                            type="button"
                            onClick={() => setAsPrimary(idx)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#534AB7] hover:bg-pink-50 rounded-lg border border-pink-200 transition-colors"
                          >
                            Set as Primary
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move up"
                          aria-label="Move up"
                        >
                          <FiArrowUp size={14} />
                        </button>

                        <button
                          type="button"
                          disabled={idx === form.images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move down"
                          aria-label="Move down"
                        >
                          <FiArrowDown size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Remove image"
                          aria-label="Remove image"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div>
            <label className={labelCls}>Specifications</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPEC_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <input className={inputCls} value={form.specs[key]} onChange={(e) => setSpec(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <label className={labelCls}>Highlights (one per line)</label>
            <textarea className={inputCls} rows={3} value={form.highlights} onChange={(e) => set('highlights', e.target.value)} placeholder={'48MP camera\n5000 mAh battery'} />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {form.images.length === 0 ? 'No images selected (will use placeholder)' : `${form.images.length} image(s) ready`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              form="product-form"
              type="submit"
              disabled={saving || isUploadInProgress}
              className="px-5 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-brand-blueHover rounded-lg disabled:opacity-60 transition-all shadow-md shadow-brand-blue/20"
            >
              {saving ? 'Saving...' : isUploadInProgress ? 'Uploading Photos...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
