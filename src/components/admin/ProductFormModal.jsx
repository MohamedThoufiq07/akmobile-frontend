import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiTrash2, FiUploadCloud, FiStar, FiArrowUp, FiArrowDown, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
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
      status: 'ready', // 'pending' | 'validating' | 'uploading' | 'verifying' | 'ready' | 'failed'
      progress: 100,
      errorMessage: '',
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
  const abortControllersRef = useRef(new Map());

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
  }, [product]);

  // Clean up object URLs and abort controllers on unmount
  useEffect(() => {
    const activeControllers = abortControllersRef.current;
    const imagesToClean = form.images;
    return () => {
      activeControllers.forEach((controller) => controller.abort());
      activeControllers.clear();
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
      const hasUploading = form.images.some((i) => ['validating', 'uploading', 'verifying'].includes(i.status));
      if (isDirty || hasUploading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, form.images]);

  // Upload single file through direct-to-storage + finalize pipeline
  const uploadFile = async (imgId, file) => {
    if (!file) return;

    if (abortControllersRef.current.has(imgId)) {
      abortControllersRef.current.get(imgId).abort();
    }
    const controller = new AbortController();
    abortControllersRef.current.set(imgId, controller);

    try {
      // 1. Validating
      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? { ...i, status: 'validating', progress: 10, errorMessage: '' } : i)),
      }));

      const sessionToken = await getUploadSession();
      if (!sessionToken) {
        throw new Error('Unable to establish upload session. Please retry.');
      }

      // 2. Authorize upload
      const authRes = await adminApi.post(
        `/products/upload-session/${sessionToken}/authorize-upload`,
        {
          filename: file.name,
          fileSize: file.size,
          contentType: file.type || 'application/octet-stream',
        },
        { signal: controller.signal }
      );

      const { uploadUrl, headers: authHeaders, stagedItemId } = authRes.data;

      // 3. Direct Upload to Staging Key
      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? { ...i, status: 'uploading', progress: 30 } : i)),
      }));

      const isLocalStage = uploadUrl.includes('/stage-local/');
      if (isLocalStage) {
        // Backend development fallback endpoint
        await adminApi.put(uploadUrl, file, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/octet-stream' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(85, Math.round((progressEvent.loaded * 60) / progressEvent.total) + 30);
              setForm((f) => ({
                ...f,
                images: f.images.map((i) => (i.id === imgId ? { ...i, progress: percent } : i)),
              }));
            }
          },
        });
      } else {
        // Direct to Vercel Blob PUT
        await axios.put(uploadUrl, file, {
          signal: controller.signal,
          headers: {
            ...authHeaders,
            'Content-Type': 'application/octet-stream',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(85, Math.round((progressEvent.loaded * 60) / progressEvent.total) + 30);
              setForm((f) => ({
                ...f,
                images: f.images.map((i) => (i.id === imgId ? { ...i, progress: percent } : i)),
              }));
            }
          },
        });
      }

      // 4. Authoritative Verification & Promotion (Finalize)
      setForm((f) => ({
        ...f,
        images: f.images.map((i) => (i.id === imgId ? { ...i, status: 'verifying', progress: 90 } : i)),
      }));

      const finalizeRes = await adminApi.post(
        `/products/upload-session/${sessionToken}/finalize-upload`,
        { stagedItemId },
        { signal: controller.signal }
      );

      const verifiedItem = finalizeRes.data.item;

      // 5. Ready
      setForm((f) => {
        const updated = f.images.map((i) => (i.id === imgId ? {
          ...i,
          url: verifiedItem.url,
          storageKey: verifiedItem.storageKey,
          filename: verifiedItem.filename || file.name,
          fileSize: verifiedItem.fileSize || file.size,
          width: verifiedItem.width,
          height: verifiedItem.height,
          status: 'ready',
          progress: 100,
          errorMessage: '',
        } : i));

        // Auto-promote first ready image as primary if none exists
        const hasReadyPrimary = updated.some((img) => img.isPrimary && img.status === 'ready');
        if (!hasReadyPrimary) {
          const firstReady = updated.find((img) => img.status === 'ready');
          if (firstReady) firstReady.isPrimary = true;
        }
        return { ...f, images: updated };
      });

      setIsDirty(true);
      abortControllersRef.current.delete(imgId);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Upload was cancelled by user; do not show failure toast
        return;
      }

      const errMsg = err.response?.data?.message || err.message || 'Upload failed';
      setForm((f) => {
        const updated = f.images.map((i) => (i.id === imgId ? {
          ...i,
          status: 'failed',
          errorMessage: errMsg,
        } : i));

        // Auto-promote next ready image if this failed image was primary
        const hasReadyPrimary = updated.some((img) => img.isPrimary && img.status === 'ready');
        if (!hasReadyPrimary) {
          const firstReady = updated.find((img) => img.status === 'ready');
          if (firstReady) firstReady.isPrimary = true;
        }
        return { ...f, images: updated };
      });

      toast.error(errMsg);
      abortControllersRef.current.delete(imgId);
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
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 5MB limit.`);
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
        errorMessage: '',
        isPrimary: isFirstEver,
        isNew: true,
      };

      newImageEntries.push(entry);
    }

    if (newImageEntries.length === 0) return;

    setForm((f) => {
      const updated = [...f.images, ...newImageEntries];
      const hasReadyPrimary = updated.some((img) => img.isPrimary && img.status === 'ready');
      if (!hasReadyPrimary && updated.length > 0) {
        const firstCandidate = updated.find((img) => img.status === 'ready') || updated[0];
        if (firstCandidate) firstCandidate.isPrimary = true;
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
      if (target) {
        if (abortControllersRef.current.has(target.id)) {
          abortControllersRef.current.get(target.id).abort();
          abortControllersRef.current.delete(target.id);
        }
        if (target.previewUrl && target.isNew && target.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(target.previewUrl);
        }
      }
      const updated = f.images.filter((_, idx) => idx !== index);
      const hasReadyPrimary = updated.some((img) => img.isPrimary && img.status === 'ready');
      if (!hasReadyPrimary) {
        const firstReady = updated.find((img) => img.status === 'ready');
        if (firstReady) firstReady.isPrimary = true;
      }
      return { ...f, images: updated };
    });
  };

  const setAsPrimary = (index) => {
    setIsDirty(true);
    setForm((f) => {
      const selected = f.images[index];
      if (!selected || selected.status !== 'ready') return f;
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

  const handleModalClose = () => {
    // Abort all in-flight requests cleanly
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    // Revoke blob preview URLs
    form.images.forEach((img) => {
      if (img.previewUrl && img.isNew && img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    onClose();
  };

  const original = Number(form.originalPrice) || 0;
  const offer = Number(form.offerPrice) || 0;
  const discount = original > 0 && offer <= original ? Math.round(((original - offer) / original) * 100) : 0;
  const deliveryVal = parseFloat(form.deliveryCharge);
  const validDelivery = isNaN(deliveryVal) || deliveryVal < 0 ? '49.00' : deliveryVal.toFixed(2);

  // Exact submit & footer conditions
  const readyCount = form.images.filter((i) => i.status === 'ready').length;
  const failedCount = form.images.filter((i) => i.status === 'failed').length;
  const inFlightCount = form.images.filter((i) => ['pending', 'validating', 'uploading', 'verifying'].includes(i.status)).length;
  const canSubmit = readyCount >= 1 && failedCount === 0 && inFlightCount === 0 && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

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

    if (inFlightCount > 0) {
      toast.error('Please wait for all image uploads to complete.');
      return;
    }

    if (failedCount > 0) {
      toast.error('Some images failed to upload. Please retry or remove them.');
      return;
    }

    if (readyCount === 0) {
      toast.error('At least one product image is required.');
      return;
    }

    // Build payload images list from verified ready images only
    const preparedImages = form.images
      .filter((img) => img.status === 'ready' && img.url)
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

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={handleModalClose}>
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
          <button onClick={handleModalClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiX size={20} /></button>
        </div>

        {/* Body */}
        <form id="product-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6">
          {/* General info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-name" className={labelCls}>Product Name *</label>
              <input id="product-name" className={inputCls} required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="iPhone 15 Pro Max" />
            </div>
            <div>
              <label htmlFor="product-brand" className={labelCls}>Brand *</label>
              <select id="product-brand" className={inputCls} required value={form.brand} onChange={(e) => set('brand', e.target.value)}>
                <option value="">Select Brand</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-category" className={labelCls}>Category *</label>
              <select id="product-category" className={inputCls} required value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="product-description" className={labelCls}>Description</label>
              <input id="product-description" className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short product summary..." />
            </div>
          </div>

          {/* Pricing, Delivery & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label htmlFor="product-original-price" className={labelCls}>Original Price (₹) *</label>
              <input id="product-original-price" className={inputCls} type="number" min="1" required value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} />
            </div>
            <div>
              <label htmlFor="product-offer-price" className={labelCls}>Offer Price (₹) *</label>
              <input id="product-offer-price" className={inputCls} type="number" min="1" required value={form.offerPrice} onChange={(e) => set('offerPrice', e.target.value)} />
            </div>
            <div>
              <label htmlFor="product-delivery-charge" className={labelCls}>Delivery Charge (₹) *</label>
              <input
                id="product-delivery-charge"
                className={inputCls}
                type="number"
                min="0"
                step="1"
                required
                value={form.deliveryCharge}
                onChange={(e) => set('deliveryCharge', e.target.value)}
                placeholder="₹ 49.00"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Enter 0 for free delivery</span>
            </div>
            <div>
              <label className={labelCls}>Discount</label>
              <input className={`${inputCls} bg-slate-50 text-slate-600 font-bold`} disabled value={`${discount}%`} />
            </div>
            <div>
              <label htmlFor="product-stock" className={labelCls}>Stock *</label>
              <input id="product-stock" className={inputCls} type="number" min="0" required value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
          </div>

          {/* Featured & Flash sale flags */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded text-brand-blue" />
              Featured product (shown on homepage)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" checked={form.flashSale} onChange={(e) => set('flashSale', e.target.checked)} className="rounded text-amber-500" />
              Include in Flash Sale ⚡
            </label>
          </div>

          {/* Multiple Product Images Upload & Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-800">Product Images ({form.images.length}/{MAX_IMAGES})</label>
                <p className="text-xs text-slate-500">
                  Drag &amp; drop or select multiple photos (front, back, sides, box). The 1st ready image is the primary image.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                JPEG, PNG, WebP • Max 5MB
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-brand-blue bg-blue-50/50 scale-[0.99]'
                  : form.images.length >= MAX_IMAGES
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : 'border-slate-200 hover:border-brand-blue hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={form.images.length >= MAX_IMAGES}
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="w-12 h-12 rounded-full bg-pink-50 text-brand-pink flex items-center justify-center mx-auto mb-2">
                <FiUploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Drag &amp; drop product photos here, or <span className="text-brand-pink underline">Browse Files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {form.images.length >= MAX_IMAGES
                  ? `Limit of ${MAX_IMAGES} images reached`
                  : `Select up to ${MAX_IMAGES - form.images.length} more images`}
              </p>
            </div>

            {/* Images List */}
            {form.images.length > 0 && (
              <div className="space-y-2 mt-4">
                {form.images.map((img, idx) => {
                  const isPrimary = Boolean(img.isPrimary && img.status === 'ready');
                  return (
                    <div
                      key={img.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isPrimary
                          ? 'border-pink-300 bg-pink-50/30 shadow-sm ring-1 ring-pink-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Image Thumbnail Preview */}
                      <div className="relative w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={img.previewUrl || getPlaceholderSvg(img.filename)}
                          alt={img.filename}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = getPlaceholderSvg(img.filename);
                          }}
                        />
                        {isPrimary && (
                          <div className="absolute top-1 left-1 bg-brand-pink text-white rounded-full p-0.5 shadow-sm" title="Primary image">
                            <FiStar size={10} className="fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Image Metadata & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate" title={img.filename}>
                            {img.filename}
                          </p>
                          {isPrimary && (
                            <span className="text-[10px] font-bold uppercase bg-pink-100 text-brand-pink px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{formatFileSize(img.fileSize)}</span>
                          <span>•</span>
                          {img.status === 'validating' && (
                            <span className="text-amber-600 font-medium">Validating...</span>
                          )}
                          {img.status === 'uploading' && (
                            <span className="text-blue-600 font-medium">Uploading... {img.progress}%</span>
                          )}
                          {img.status === 'verifying' && (
                            <span className="text-indigo-600 font-medium">Verifying...</span>
                          )}
                          {img.status === 'ready' && (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <FiCheckCircle size={12} /> Ready
                            </span>
                          )}
                          {img.status === 'failed' && (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                              <FiAlertCircle size={12} /> {img.errorMessage || 'Upload failed'}
                            </span>
                          )}
                        </div>

                        {/* Upload Progress Bar */}
                        {['uploading', 'verifying'].includes(img.status) && (
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
                        {img.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => retryUpload(img)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Retry
                          </button>
                        )}

                        {!isPrimary && img.status === 'ready' && (
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
            {failedCount > 0
              ? `${readyCount} image(s) ready, ${failedCount} failed`
              : inFlightCount > 0
              ? `${readyCount} image(s) ready, ${inFlightCount} uploading`
              : readyCount === 0
              ? '0 images ready (At least one product image is required)'
              : `${readyCount} image(s) ready`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              form="product-form"
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-brand-blueHover rounded-lg disabled:opacity-50 transition-all shadow-md shadow-brand-blue/20"
            >
              {saving ? 'Saving...' : inFlightCount > 0 ? 'Uploading Photos...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
