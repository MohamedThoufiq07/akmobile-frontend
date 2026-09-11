import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiTrash2, FiUploadCloud, FiStar, FiArrowUp, FiArrowDown, FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { upload } from '@vercel/blob/client';
import adminApi from '../../utils/adminApi';
import {
  MIN_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_BYTES,
  ACCEPTED_PRODUCT_IMAGE_TYPES,
  BRANDS,
  CATEGORIES,
} from '../../utils/constants';
import { getPlaceholderSvg, getCanonicalMimeAndExt, normalizeProductImageFile } from '../../utils/imageHelper';

const SPEC_FIELDS = [
  ['processor', 'Processor'], ['ram', 'RAM'], ['storage', 'Storage'],
  ['display', 'Display'], ['camera', 'Camera'], ['battery', 'Battery'],
  ['os', 'OS'], ['connectivity', 'Connectivity'], ['weight', 'Weight'], ['colors', 'Colors'],
];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const recalculatePrimary = (images) => {
  const readyImages = images.filter((img) => img.status === 'ready');
  if (readyImages.length === 0) {
    return images.map((img) => ({ ...img, isPrimary: false }));
  }
  const existingReadyPrimary = readyImages.find((img) => img.isPrimary);
  const primaryId = existingReadyPrimary ? existingReadyPrimary.id : readyImages[0].id;
  return images.map((img) => ({
    ...img,
    isPrimary: img.id === primaryId && img.status === 'ready',
  }));
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
      file: null,
      sortOrder: idx,
      status: 'ready', // 'pending' | 'validating' | 'authorizing' | 'uploading' | 'verifying' | 'ready' | 'failed'
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
    images: recalculatePrimary(existingImages),
  };
};

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

const ProductFormModal = ({ product, isOpen = true, onClose, onSaved }) => {
  const isEdit = Boolean(product?._id || product?.id);
  const [form, setForm] = useState(() => blankFromProduct(product));
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const abortControllersRef = useRef(new Map());
  const previewUrlsRef = useRef(new Set());
  const rawFilesMapRef = useRef(new Map());

  const set = (key, value) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setSpec = (key, value) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
  };

  const updateImageItem = useCallback((id, updates) => {
    setForm((prev) => {
      const updated = prev.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      );
      return {
        ...prev,
        images: recalculatePrimary(updated),
      };
    });
  }, []);

  const cancelAllImageOperations = useCallback(({ silent = true } = {}) => {
    abortControllersRef.current.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    abortControllersRef.current.clear();
    rawFilesMapRef.current.clear();
    if (!silent) {
      toast.error('Active upload operations cancelled.');
    }
  }, []);

  const revokeAllPreviewUrls = useCallback(() => {
    previewUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        void err;
      }
    });
    previewUrlsRef.current.clear();
  }, []);

  const handleClose = useCallback(() => {
    cancelAllImageOperations({ silent: true });
    revokeAllPreviewUrls();
    if (onClose) onClose();
  }, [cancelAllImageOperations, revokeAllPreviewUrls, onClose]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      cancelAllImageOperations({ silent: true });
      revokeAllPreviewUrls();
    };
  }, [cancelAllImageOperations, revokeAllPreviewUrls]);

  // Modal close detection
  useEffect(() => {
    if (isOpen === false) {
      cancelAllImageOperations({ silent: true });
      revokeAllPreviewUrls();
    }
  }, [isOpen, cancelAllImageOperations, revokeAllPreviewUrls]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Before unload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasInFlight = form.images.some((i) =>
        ['validating', 'authorizing', 'uploading', 'verifying'].includes(i.status)
      );
      if (isDirty || hasInFlight) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, form.images]);

  // Upload session helper
  const getUploadSession = useCallback(async (signal) => {
    if (sessionTokenRef.current) return sessionTokenRef.current;
    try {
      const { data } = await adminApi.post('/products/upload-session', {
        productId: product?._id,
      }, { signal, timeout: 15000 });
      if (data.token) {
        sessionTokenRef.current = data.token;
        return data.token;
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'AbortError' || err.name === 'CanceledError') {
        throw err;
      }
    }
    return null;
  }, [product]);

  // Client-side image validation with 10s timeout
  const validateClientFile = useCallback((file, signal) => {
    if (!file) {
      return Promise.reject(new Error('No file provided.'));
    }
    if (file.size <= 0) {
      return Promise.reject(new Error('File is empty.'));
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      return Promise.reject(new Error(`File size (${formatFileSize(file.size)}) exceeds 5MB limit.`));
    }

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'));
      }

      let settled = false;
      let timer = null;
      let validationUrl = '';

      const cleanup = () => {
        settled = true;
        if (timer) clearTimeout(timer);
        if (validationUrl) {
          URL.revokeObjectURL(validationUrl);
          validationUrl = '';
        }
      };

      timer = setTimeout(() => {
        if (!settled) {
          cleanup();
          reject(new Error('Image validation timed out after 10 seconds.'));
        }
      }, 10000);

      if (signal) {
        signal.addEventListener('abort', () => {
          if (!settled) {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
          }
        }, { once: true });
      }

      try {
        validationUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          if (settled) return;
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          cleanup();
          if (width && height && (width < 10 || height < 10)) {
            reject(new Error('Image dimensions too small (minimum 10x10px).'));
          } else {
            resolve({ width, height });
          }
        };

        img.onerror = () => {
          if (settled) return;
          cleanup();
          // Allow binary images to reach backend verification even if browser decode fails
          resolve({ width: 0, height: 0 });
        };

        img.onabort = () => {
          if (settled) return;
          cleanup();
          reject(new DOMException('Aborted', 'AbortError'));
        };

        img.src = validationUrl;
      } catch {
        cleanup();
        resolve({ width: 0, height: 0 });
      }
    });
  }, []);

  const logTransition = (imgId, fromState, toState) => {
    if (import.meta.env.DEV) {
      console.log(`[${imgId}] ${fromState} → ${toState}`);
    }
  };

  // Seven-state upload pipeline
  const uploadFile = async (imgId, originalFile) => {
    const file = normalizeProductImageFile(originalFile || rawFilesMapRef.current.get(imgId));
    if (!file) return;
    rawFilesMapRef.current.set(imgId, file);

    if (abortControllersRef.current.has(imgId)) {
      const existing = abortControllersRef.current.get(imgId);
      if (!existing.signal.aborted) existing.abort();
    }
    const controller = new AbortController();
    abortControllersRef.current.set(imgId, controller);

    try {
      // 1. Validating
      logTransition(imgId, 'selected', 'validating');
      updateImageItem(imgId, { status: 'validating', progress: 10, errorMessage: '', file });

      await validateClientFile(file, controller.signal);

      // 2. Authorizing
      logTransition(imgId, 'validating', 'authorizing');
      updateImageItem(imgId, { status: 'authorizing', progress: 20 });

      const sessionToken = await getUploadSession(controller.signal);
      if (!sessionToken) {
        throw new Error('Unable to establish upload session. Please retry.');
      }

      const { mime: canonicalMime, ext: canonicalExt } = getCanonicalMimeAndExt(file);

      const authRes = await adminApi.post(
        `/products/upload-session/${sessionToken}/authorize-upload`,
        {
          filename: file.name,
          fileSize: file.size,
          contentType: canonicalMime,
        },
        { signal: controller.signal, timeout: 15000 }
      );

      const { stagedItemId, uploadGrant, pathname, mode, uploadUrl: localUploadUrl, handleUploadUrl } = authRes.data;

      // 3. Uploading (Direct to Vercel Blob via @vercel/blob/client)
      logTransition(imgId, 'authorizing', 'uploading');
      updateImageItem(imgId, { status: 'uploading', progress: 30 });

      if (import.meta.env.DEV) {
        console.debug({
          name: file.name,
          type: file.type,
          size: file.size,
          isFile: file instanceof File,
        });
      }

      let uploadedBlobUrl = '';
      let uploadedBlobPathname = pathname;

      if (mode === 'local' && localUploadUrl && localUploadUrl.includes('/stage-local/')) {
        // Fallback for offline local dev/unit testing
        await adminApi.put(localUploadUrl, file, {
          signal: controller.signal,
          timeout: 120000,
          headers: { 'Content-Type': file.type || canonicalMime },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(85, Math.round((progressEvent.loaded * 55) / progressEvent.total) + 30);
              updateImageItem(imgId, { progress: percent });
            }
          },
        });
        uploadedBlobUrl = localUploadUrl;
      } else {
        // Official @vercel/blob direct browser upload with normalized File
        const targetPathname = pathname || `products/staging/${sessionToken}/${stagedItemId}${canonicalExt}`;
        const blobResult = await upload(targetPathname, file, {
          access: 'public',
          handleUploadUrl: handleUploadUrl || '/api/product-image-upload',
          clientPayload: JSON.stringify({
            grant: uploadGrant,
            stagedItemId,
            sessionToken,
            filename: file.name,
          }),
          abortSignal: controller.signal,
          onUploadProgress: (progressEvent) => {
            const pct = Math.min(85, Math.round((progressEvent.percentage * 55) / 100) + 30);
            updateImageItem(imgId, { progress: pct });
          },
        });

        uploadedBlobUrl = blobResult.url;
        uploadedBlobPathname = blobResult.pathname || targetPathname;
      }

      // 4. Verifying with Django Backend
      logTransition(imgId, 'uploading', 'verifying');
      updateImageItem(imgId, { status: 'verifying', progress: 90 });

      const finalizeRes = await adminApi.post(
        `/products/upload-session/${sessionToken}/finalize-upload`,
        {
          stagedItemId,
          blobUrl: uploadedBlobUrl,
          blobPathname: uploadedBlobPathname,
        },
        { signal: controller.signal, timeout: 25000 }
      );

      const verifiedItem = finalizeRes.data.item;

      // 5. Ready
      logTransition(imgId, 'verifying', 'ready');
      updateImageItem(imgId, {
        url: verifiedItem.url,
        storageKey: verifiedItem.storageKey,
        filename: verifiedItem.filename || file.name,
        fileSize: verifiedItem.fileSize || file.size,
        status: 'ready',
        progress: 100,
        errorMessage: '',
      });

      setIsDirty(true);
      abortControllersRef.current.delete(imgId);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError' || controller.signal.aborted) {
        // Cancelled cleanly
        abortControllersRef.current.delete(imgId);
        return;
      }

      logTransition(imgId, 'in-flight', 'failed');

      let errMsg = 'Upload failed';
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.code;
      const reqId = data?.request_id ? ` (Req ID: ${data.request_id.slice(0, 8)})` : '';

      if (code === 'SESSION_EXPIRED' || status === 409) {
        errMsg = `Session expired. Please retry.${reqId}`;
      } else if (code === 'MAX_IMAGES_EXCEEDED') {
        errMsg = data?.message || `Maximum 5 images allowed.${reqId}`;
      } else if (code === 'INVALID_IMAGE' || status === 400) {
        errMsg = data?.message || `Image verification failed.${reqId}`;
      } else if (status === 503) {
        errMsg = `Storage temporarily unavailable.${reqId}`;
      } else if (status === 504 || err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = `Upload timed out. Please retry.${reqId}`;
      } else if (status === 401 || status === 403 || code === 'UPLOAD_AUTHORIZATION_FAILED') {
        errMsg = `Authorization failed.${reqId}`;
      } else if (data?.message) {
        errMsg = `${data.message}${reqId}`;
      } else if (err.message) {
        errMsg = err.message.replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, '[REDACTED]');
      }

      updateImageItem(imgId, {
        status: 'failed',
        errorMessage: errMsg,
      });

      toast.error(errMsg);
      abortControllersRef.current.delete(imgId);
    }
  };

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;

    const currentCount = form.images.length;
    const remainingSlots = MAX_PRODUCT_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum limit of ${MAX_PRODUCT_IMAGES} images reached.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesArr = Array.from(files);
    if (filesArr.length > remainingSlots) {
      toast.error(`Maximum ${MAX_PRODUCT_IMAGES} product images allowed. You can select only ${remainingSlots} more images.`);
    }

    const selectedFiles = filesArr.slice(0, remainingSlots);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const newEntries = selectedFiles.map((rawFile, idx) => {
      const file = normalizeProductImageFile(rawFile);
      const tempId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      rawFilesMapRef.current.set(tempId, file);
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      return {
        id: tempId,
        url: '',
        storageKey: '',
        filename: file.name,
        fileSize: file.size,
        previewUrl,
        file,
        sortOrder: currentCount + idx,
        status: 'pending',
        progress: 0,
        errorMessage: '',
        isPrimary: currentCount === 0 && idx === 0,
        isNew: true,
      };
    });

    setForm((prev) => ({
      ...prev,
      images: recalculatePrimary([...prev.images, ...newEntries]),
    }));
    setIsDirty(true);

    // Process files independently
    await Promise.allSettled(
      newEntries.map((entry) => uploadFile(entry.id, entry.file))
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (form.images.length < MAX_PRODUCT_IMAGES) {
      setIsDragging(true);
    }
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
    if (form.images.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`Maximum ${MAX_PRODUCT_IMAGES} product images reached.`);
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    setIsDirty(true);
    setForm((f) => {
      const target = f.images[index];
      if (target) {
        rawFilesMapRef.current.delete(target.id);
        if (abortControllersRef.current.has(target.id)) {
          const c = abortControllersRef.current.get(target.id);
          if (!c.signal.aborted) c.abort();
          abortControllersRef.current.delete(target.id);
        }
        if (target.previewUrl && previewUrlsRef.current.has(target.previewUrl)) {
          try {
            URL.revokeObjectURL(target.previewUrl);
          } catch (err) {
            void err;
          }
          previewUrlsRef.current.delete(target.previewUrl);
        }
      }
      const updated = f.images.filter((_, idx) => idx !== index).map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }));
      return { ...f, images: recalculatePrimary(updated) };
    });
  };

  const setAsPrimary = (index) => {
    setIsDirty(true);
    setForm((f) => {
      const selected = f.images[index];
      if (!selected || selected.status !== 'ready') return f;
      const reordered = f.images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }));
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
      const reordered = copy.map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }));
      return {
        ...f,
        images: recalculatePrimary(reordered),
      };
    });
  };

  const retryUpload = (img) => {
    const file = rawFilesMapRef.current.get(img.id) || img.file;
    if (file) {
      uploadFile(img.id, file);
    }
  };

  const original = Number(form.originalPrice) || 0;
  const offer = Number(form.offerPrice) || 0;
  const discount = original > 0 && offer <= original ? Math.round(((original - offer) / original) * 100) : 0;
  const deliveryVal = parseFloat(form.deliveryCharge);
  const validDelivery = isNaN(deliveryVal) || deliveryVal < 0 ? '49.00' : deliveryVal.toFixed(2);

  // Accurate counters
  const selectedCount = form.images.length;
  const readyCount = form.images.filter((i) => i.status === 'ready').length;
  const failedCount = form.images.filter((i) => i.status === 'failed').length;
  const validatingCount = form.images.filter((i) => i.status === 'validating').length;
  const authorizingCount = form.images.filter((i) => i.status === 'authorizing').length;
  const uploadingCount = form.images.filter((i) => i.status === 'uploading').length;
  const verifyingCount = form.images.filter((i) => i.status === 'verifying').length;
  const inFlightCount = form.images.filter((i) =>
    ['pending', 'validating', 'authorizing', 'uploading', 'verifying'].includes(i.status)
  ).length;

  const isFormValid = Boolean(
    form.name.trim() &&
    form.brand &&
    form.category &&
    form.offerPrice &&
    form.stock !== ''
  );

  const canSubmit =
    isFormValid &&
    readyCount >= MIN_PRODUCT_IMAGES &&
    selectedCount <= MAX_PRODUCT_IMAGES &&
    failedCount === 0 &&
    inFlightCount === 0 &&
    !saving;

  const getSubmitButtonLabel = () => {
    if (saving) return isEdit ? 'Saving Changes...' : 'Creating Product...';
    if (validatingCount > 0) return 'Validating Photos...';
    if (authorizingCount > 0) return 'Preparing Upload...';
    if (uploadingCount > 0) return 'Uploading Photos...';
    if (verifyingCount > 0) return 'Verifying Photos...';
    return isEdit ? 'Save Changes' : 'Create Product';
  };

  const getFooterStatusText = () => {
    if (readyCount === 0 && inFlightCount === 0 && failedCount === 0) {
      return 'At least one product image is required';
    }
    const parts = [];
    if (readyCount > 0) {
      parts.push(`${readyCount} image${readyCount > 1 ? 's' : ''} ready`);
    }
    if (validatingCount > 0) {
      parts.push(`${validatingCount} validating`);
    }
    if (authorizingCount > 0) {
      parts.push(`${authorizingCount} preparing`);
    }
    if (uploadingCount > 0) {
      parts.push(`${uploadingCount} uploading`);
    }
    if (verifyingCount > 0) {
      parts.push(`${verifyingCount} verifying`);
    }
    if (failedCount > 0) {
      parts.push(`${failedCount} failed`);
    }
    return parts.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (readyCount < MIN_PRODUCT_IMAGES) {
        toast.error('Please upload at least one verified product photo.');
      } else if (selectedCount > MAX_PRODUCT_IMAGES) {
        toast.error(`Maximum limit is ${MAX_PRODUCT_IMAGES} images.`);
      } else if (inFlightCount > 0) {
        toast.error('Please wait for active photo uploads to finish.');
      } else if (failedCount > 0) {
        toast.error('Please retry or remove failed image uploads before saving.');
      }
      return;
    }

    const readyImages = form.images.filter((img) => img.status === 'ready');
    const preparedImages = readyImages.map((img, idx) => ({
      id: img.isNew ? undefined : img.id,
      url: img.url,
      storageKey: img.storageKey,
      altText: img.filename || `${form.name} photo ${idx + 1}`,
      isPrimary: Boolean(img.isPrimary),
      sortOrder: idx,
    }));

    const payload = {
      name: form.name.trim(),
      brand: form.brand,
      category: form.category,
      description: form.description.trim(),
      originalPrice: original,
      offerPrice: offer,
      deliveryCharge: validDelivery,
      stock: parseInt(form.stock, 10) || 0,
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
      handleClose();
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={handleClose}>
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
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiX size={20} /></button>
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
                <label className="block text-sm font-bold text-slate-800">
                  Product Images ({selectedCount}/{MAX_PRODUCT_IMAGES})
                </label>
                <p className="text-xs text-slate-500">
                  {MAX_PRODUCT_IMAGES - selectedCount > 0
                    ? `Select up to ${MAX_PRODUCT_IMAGES - selectedCount} more images`
                    : `Maximum ${MAX_PRODUCT_IMAGES} product images reached`}
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
              onClick={() => {
                if (selectedCount < MAX_PRODUCT_IMAGES) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                selectedCount >= MAX_PRODUCT_IMAGES
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : isDragging
                  ? 'border-brand-blue bg-blue-50/50 scale-[0.99] cursor-pointer'
                  : 'border-slate-200 hover:border-brand-blue hover:bg-slate-50/60 cursor-pointer'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_PRODUCT_IMAGE_TYPES.join(',')}
                className="hidden"
                disabled={selectedCount >= MAX_PRODUCT_IMAGES}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center">
                  <FiUploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedCount >= MAX_PRODUCT_IMAGES
                    ? `Maximum ${MAX_PRODUCT_IMAGES} product images reached`
                    : 'Drag & drop product photos here, or Browse Files'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedCount >= MAX_PRODUCT_IMAGES
                    ? 'Remove an image below to add a replacement'
                    : `Select up to ${MAX_PRODUCT_IMAGES - selectedCount} more images`}
                </p>
              </div>
            </div>

            {/* Selected Images List */}
            {form.images.length > 0 && (
              <div className="space-y-2 mt-4">
                {form.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      img.status === 'failed'
                        ? 'border-rose-200 bg-rose-50/40'
                        : img.isPrimary
                        ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                      <img
                        src={img.previewUrl || img.url || getPlaceholderSvg(48, 48, 'Photo')}
                        alt={img.filename}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderSvg(48, 48, 'Photo');
                        }}
                      />
                      {img.isPrimary && (
                        <span className="absolute bottom-0 left-0 right-0 bg-brand-blue text-[9px] text-white font-bold py-0.5 text-center tracking-wider uppercase">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Metadata & Progress Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={img.filename}>
                          {img.filename}
                        </span>
                        {img.fileSize > 0 && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatFileSize(img.fileSize)}
                          </span>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="mt-1 flex items-center gap-2">
                        {img.status === 'validating' && (
                          <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            Validating...
                          </span>
                        )}
                        {img.status === 'authorizing' && (
                          <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            Preparing upload...
                          </span>
                        )}
                        {img.status === 'uploading' && (
                          <div className="flex-1 max-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span>Uploading...</span>
                              <span>{img.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-brand-blue h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {img.status === 'verifying' && (
                          <span className="text-[11px] font-medium text-blue-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                            Verifying...
                          </span>
                        )}
                        {img.status === 'ready' && (
                          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                            <FiCheckCircle size={12} />
                            Ready
                          </span>
                        )}
                        {img.status === 'failed' && (
                          <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1 truncate" title={img.errorMessage}>
                            <FiAlertCircle size={12} className="shrink-0" />
                            {img.errorMessage || 'Upload failed'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {img.status === 'failed' ? (
                        <button
                          type="button"
                          onClick={() => retryUpload(img)}
                          className="px-2.5 py-1 text-xs font-semibold text-brand-blue hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <FiRefreshCw size={12} />
                          Retry
                        </button>
                      ) : img.status === 'ready' && !img.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => setAsPrimary(idx)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-brand-blue hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Set as primary product photo"
                          aria-label="Set as primary product photo"
                        >
                          <FiStar size={12} />
                          Set Primary
                        </button>
                      ) : null}

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <FiArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === form.images.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <FiArrowDown size={14} />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highlights & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-highlights" className={labelCls}>Key Highlights (1 per line)</label>
              <textarea
                id="product-highlights"
                className={`${inputCls} h-28 font-mono text-xs`}
                value={form.highlights}
                onChange={(e) => set('highlights', e.target.value)}
                placeholder="6.7-inch Super Retina XDR display&#10;Titanium design with textured matte glass&#10;A17 Pro chip with 6-core GPU"
              />
            </div>
            <div>
              <label htmlFor="product-specs-processor" className={labelCls}>Specifications</label>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {SPEC_FIELDS.map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 w-24 shrink-0">{label}:</span>
                    <input
                      id={`product-specs-${key}`}
                      className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      value={form.specs[key] || ''}
                      onChange={(e) => setSpec(key, e.target.value)}
                      placeholder={`e.g. ${label}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium truncate max-w-[280px]" title={getFooterStatusText()}>
            {getFooterStatusText()}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={!canSubmit}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-md ${
                canSubmit
                  ? 'bg-brand-blue text-white hover:bg-blue-600 shadow-blue-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {getSubmitButtonLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
