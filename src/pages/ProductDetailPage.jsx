import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiShoppingCart, FiHeart, FiCheck, FiTruck, FiShield, FiZap, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiLoader, FiRotateCcw } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import api from '../utils/api';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { useWishlist } from '../context/useWishlist';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useNotification } from '../context/useNotification';
import { formatErrorMessage } from '../utils/formatError';
import { formatPrice } from '../utils/formatPrice';
import RatingStars from '../components/ui/RatingStars';
import ProductCard from '../components/ui/ProductCard';
import { ProductDetailSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { getValidImageUrl, getPlaceholderSvg } from '../utils/imageHelper';
import RatingBreakdown from '../components/reviews/RatingBreakdown';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewFormModal from '../components/reviews/ReviewFormModal';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const notify = useNotification();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(location.hash === '#reviews' ? 'reviews' : 'description');
  const [showZoom, setShowZoom] = useState(false);
  const [zoomState, setZoomState] = useState({ lensX: 0, lensY: 0, bgX: 0, bgY: 0 });

  // Review & Eligibility state
  const [reviewsData, setReviewsData] = useState({
    summary: { averageRating: 0, reviewCount: 0, distribution: {} },
    results: [],
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [eligibility, setEligibility] = useState({
    canReview: false,
    reason: null,
    isVerifiedPurchase: false,
    existingReviewId: null,
    existingReview: null,
  });
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const thumbnailContainerRef = useRef(null);

  const handleMouseMove = (e) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensWidth = 160;
    const lensHeight = 160;

    let lensX = x - lensWidth / 2;
    let lensY = y - lensHeight / 2;

    if (lensX < 0) lensX = 0;
    if (lensX > rect.width - lensWidth) lensX = rect.width - lensWidth;

    if (lensY < 0) lensY = 0;
    if (lensY > rect.height - lensHeight) lensY = rect.height - lensHeight;

    const bgX = (lensX / (rect.width - lensWidth)) * 100;
    const bgY = (lensY / (rect.height - lensHeight)) * 100;

    setZoomState({ lensX, lensY, bgX, bgY });
  };

  useEffect(() => {
    let ignore = false;
    const fetchProductDetails = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (!ignore) {
          setProduct(data.product);
          addRecentlyViewed(data.product);
          setActiveImage(0); // Reset image on new product
          setError(null);
        }

        // Fetch related products
        const relatedRes = await api.get(`/products/${id}/related`);
        if (!ignore) {
          setRelatedProducts(Array.isArray(relatedRes.data?.products) ? relatedRes.data.products : []);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError('Product not found or error loading details.');
          setLoading(false);
        }
      }
    };

    fetchProductDetails();
    window.scrollTo(0, 0);
    return () => {
      ignore = true;
    };
  }, [id, addRecentlyViewed]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const scrollThumbnails = (direction) => {
    if (!thumbnailContainerRef.current) return;
    const offset = direction === 'next' ? 120 : -120;
    thumbnailContainerRef.current.scrollBy({
      top: offset,
      left: offset,
      behavior: 'smooth',
    });
  };

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const { data } = await api.get(`/products/${id}/reviews`);
      if (data.success) {
        setReviewsData({
          summary: data.summary || { averageRating: 0, reviewCount: 0, distribution: {} },
          results: data.results || [],
        });
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                rating: data.summary?.averageRating ?? prev.rating,
                numReviews: data.summary?.reviewCount ?? prev.numReviews,
                reviews: data.results || prev.reviews,
              }
            : prev
        );
      }
      setReviewsError(null);
    } catch {
      setReviewsError('Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const fetchEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setEligibility({
        canReview: false,
        reason: 'AUTHENTICATION_REQUIRED',
        isVerifiedPurchase: false,
        existingReviewId: null,
        existingReview: null,
      });
      return;
    }
    try {
      const { data } = await api.get(`/products/${id}/reviews/eligibility`);
      setEligibility(data);
    } catch {
      // safe fallback
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      if (!ignore) {
        await fetchReviews();
        await fetchEligibility();
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, [fetchReviews, fetchEligibility]);

  const handleWriteReviewClick = async () => {
    if (!isAuthenticated) {
      notify.info('Please sign in to write a review.');
      navigate(`/login?redirect=${encodeURIComponent(`/products/${id}#reviews`)}`);
      return;
    }

    setCheckingEligibility(true);
    try {
      const { data } = await api.get(`/products/${id}/reviews/eligibility`);
      setEligibility(data);

      if (data.canReview) {
        setEditingReview(null);
        setIsReviewModalOpen(true);
      } else if (data.reason === 'REVIEW_ALREADY_EXISTS') {
        const existing = data.existingReview || (data.existingReviewId ? { _id: data.existingReviewId } : null);
        setEditingReview(existing);
        setIsReviewModalOpen(true);
      } else if (data.reason === 'PURCHASE_REQUIRED') {
        notify.error('Only customers who purchased this product can review it.');
      } else if (data.reason === 'ORDER_NOT_DELIVERED') {
        notify.warning('You can review this product after it has been delivered.');
      } else if (data.reason === 'PAYMENT_NOT_VERIFIED') {
        notify.error('Your payment has not been verified for this order.');
      } else if (data.reason === 'PRODUCT_INACTIVE') {
        notify.error('This product is no longer active.');
      } else {
        notify.error('You are not eligible to review this product.');
      }
    } catch (err) {
      notify.error(formatErrorMessage(err, 'Failed to verify review eligibility.'));
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleEditReviewFromCard = (rev) => {
    setEditingReview(rev);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (formData) => {
    setSubmittingReview(true);
    try {
      if (editingReview && editingReview._id) {
        await api.put(`/products/${id}/reviews/${editingReview._id}`, formData);
        notify.success('Review updated successfully.');
      } else {
        await api.post(`/products/${id}/reviews`, formData);
        notify.success('Review submitted successfully.');
      }
      setIsReviewModalOpen(false);
      await fetchReviews();
      await fetchEligibility();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      notify.error(formatErrorMessage(err, msg));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <PageSkeleton loading={true} statusText="Loading product details, please wait...">
        <ProductDetailSkeleton />
      </PageSkeleton>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="text-6xl mb-4 text-slate-300">📱</div>
        <h2 className="text-2xl font-bold mb-4">{error || 'Product not found'}</h2>
        <Link to="/products" className="btn-primary">Back to Products</Link>
      </div>
    );
  }

  const isWished = isInWishlist(product._id);

  // Normalize gallery images
  const uniqueImages = [];
  const seenUrls = new Set();

  (product.images || []).forEach((img, idx) => {
    const rawUrl = typeof img === 'string' ? img : img.url;
    if (rawUrl && !seenUrls.has(rawUrl)) {
      seenUrls.add(rawUrl);
      uniqueImages.push({
        url: rawUrl,
        alt: (typeof img === 'object' && (img.altText || img.alt)) ? (img.altText || img.alt) : `${product.name} angle ${idx + 1}`,
      });
    }
  });

  if (uniqueImages.length === 0) {
    uniqueImages.push({
      url: getPlaceholderSvg(product.name),
      alt: product.name,
    });
  }

  const currentImgUrl = getValidImageUrl(uniqueImages[activeImage]?.url, product.name);
  const deliveryChargeNum = parseFloat(product.deliveryCharge);
  const isFreeDelivery = isNaN(deliveryChargeNum) || deliveryChargeNum === 0;

  return (
    <>
      <Helmet>
        <title>{product.name} | AK Mobiles</title>
        <meta name="description" content={product.description?.substring(0, 150) || product.name} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">

          {/* Left Column - Image Gallery (Thumbnails on Left for Desktop, Below for Mobile) */}
          <Reveal className="lg:w-1/2 min-w-0 flex flex-col md:flex-row gap-4 items-start">

            {/* Desktop Thumbnail Column (Left side of main image) & Mobile Thumbnail Strip (Below main image on mobile) */}
            <div className="order-2 md:order-1 flex md:flex-col items-center gap-2 w-full md:w-20 shrink-0">
              {uniqueImages.length > 5 && (
                <button
                  type="button"
                  onClick={() => scrollThumbnails('prev')}
                  aria-label="Previous thumbnails"
                  className="hidden md:flex p-1 text-slate-400 hover:text-[#534AB7] hover:bg-slate-100 rounded-full transition-colors"
                >
                  <FiChevronUp size={18} />
                </button>
              )}

              {/* Mobile Prev Arrow */}
              {uniqueImages.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollThumbnails('prev')}
                  aria-label="Previous thumbnails"
                  className="md:hidden p-2 text-slate-500 hover:text-[#534AB7] bg-slate-100 rounded-full shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <FiChevronLeft size={18} />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={thumbnailContainerRef}
                className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[450px] w-full py-1 scroll-smooth no-scrollbar"
              >
                {uniqueImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveImage(index);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View photo ${index + 1} of ${uniqueImages.length}`}
                    className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl p-1.5 border-2 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#534AB7] ${
                      activeImage === index
                        ? 'border-[#534AB7] bg-pink-50/30 shadow-sm scale-102 ring-1 ring-[#534AB7]'
                        : 'border-slate-200 bg-slate-50/70 opacity-75 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={getValidImageUrl(img.url, product.name)}
                      alt={img.alt || `${product.name} view ${index + 1}`}
                      className="w-full h-full object-contain pointer-events-none select-none"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getPlaceholderSvg(product.name);
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Mobile Next Arrow */}
              {uniqueImages.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollThumbnails('next')}
                  aria-label="Next thumbnails"
                  className="md:hidden p-2 text-slate-500 hover:text-[#534AB7] bg-slate-100 rounded-full shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <FiChevronRight size={18} />
                </button>
              )}

              {uniqueImages.length > 5 && (
                <button
                  type="button"
                  onClick={() => scrollThumbnails('next')}
                  aria-label="Next thumbnails"
                  className="hidden md:flex p-1 text-slate-400 hover:text-[#534AB7] hover:bg-slate-100 rounded-full transition-colors"
                >
                  <FiChevronDown size={18} />
                </button>
              )}
            </div>

            {/* Main Display Image */}
            <div
              className="order-1 md:order-2 flex-1 w-full bg-slate-50 rounded-2xl p-6 sm:p-8 relative flex items-center justify-center border border-slate-100 group cursor-zoom-in min-h-[320px] sm:min-h-[450px]"
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={handleMouseMove}
            >
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-md z-10">
                  {product.discount}% OFF
                </div>
              )}

              <img
                src={currentImgUrl}
                alt={uniqueImages[activeImage]?.alt || product.name}
                className="w-full h-auto max-h-[450px] object-contain select-none pointer-events-none transition-transform duration-300"
                loading="eager"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getPlaceholderSvg(product.name);
                }}
              />

              {showZoom && (
                <div
                  className="absolute bg-white/40 border border-white/70 pointer-events-none z-10 shadow-sm rounded-lg"
                  style={{
                    left: `${zoomState.lensX}px`,
                    top: `${zoomState.lensY}px`,
                    width: '160px',
                    height: '160px',
                  }}
                />
              )}

              {showZoom && (
                <div
                  className="hidden lg:block absolute left-[105%] top-0 w-[550px] h-[480px] bg-slate-50 border border-slate-200 shadow-2xl rounded-2xl z-30 overflow-hidden pointer-events-none"
                  style={{
                    backgroundImage: `url(${currentImgUrl})`,
                    backgroundPosition: `${zoomState.bgX}% ${zoomState.bgY}%`,
                    backgroundSize: '250% 250%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )}
            </div>
          </Reveal>

          {/* Right Column - Product Info */}
          <Reveal delay={0.1} className="lg:w-1/2 min-w-0 flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-bold text-brand-blue tracking-wider uppercase">{product.brand}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                <span className="font-bold mr-2 text-sm text-slate-800">{product.rating.toFixed(1)}</span>
                <RatingStars rating={product.rating} />
              </div>
              <a href="#reviews" className="text-sm text-brand-blue hover:underline font-medium">
                {product.numReviews} Reviews
              </a>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">{product.numSold} sold</span>
            </div>

            <div className="mb-4 flex items-end gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900">{formatPrice(product.offerPrice)}</span>
              {product.originalPrice > product.offerPrice && (
                <span className="text-lg sm:text-xl text-slate-400 line-through mb-1">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            {/* Delivery Charge Info */}
            <div className="mb-6 flex items-center gap-2 text-sm">
              <FiTruck className="text-brand-blue shrink-0" size={18} />
              {isFreeDelivery ? (
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Free Delivery
                </span>
              ) : (
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                  Delivery ₹{deliveryChargeNum % 1 === 0 ? deliveryChargeNum : deliveryChargeNum.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mb-6 pb-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3">Key Highlights</h3>
              <ul className="space-y-2">
                {product.highlights?.slice(0, 4).map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <FiCheck className="text-emerald-500 mt-1 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ACTION BUTTONS SECTION */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className={`font-semibold text-sm ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-slate-200 rounded-xl h-12 w-32 shrink-0 bg-slate-50/50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={product.stock <= 0}
                    className="w-9 h-full flex items-center justify-center font-semibold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-full text-center bg-transparent font-bold text-slate-800 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={product.stock <= 0 || quantity >= product.stock}
                    className="w-9 h-full flex items-center justify-center font-semibold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 h-12 px-5 bg-pink-50 hover:bg-pink-100/80 text-brand-blue font-bold rounded-xl flex items-center justify-center gap-2 border border-pink-200/60 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-50"
                >
                  <FiShoppingCart className="text-lg" />
                  <span>Add to Cart</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className="h-12 w-12 shrink-0 border border-slate-200 rounded-xl flex items-center justify-center hover:border-red-200 hover:bg-red-50/50 transition-all text-slate-400 hover:text-red-500 focus:outline-none"
                  title="Wishlist"
                >
                  {isWished ? <FaHeart className="text-red-500" size={20} /> : <FiHeart size={20} />}
                </button>
              </div>

              {/* Buy it Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="w-full mt-3 h-12 bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blueHover hover:to-purple-700 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-md shadow-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/30 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <FiZap className="text-lg" />
                <span>Buy it Now</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-6 p-4 bg-slate-50/70 rounded-xl mt-auto border border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <FiTruck className="text-brand-blue" size={18} />
                <span>{isFreeDelivery ? 'Free Delivery' : `Delivery ₹${deliveryChargeNum.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <FiShield className="text-brand-blue" size={18} />
                <span>1 Year Warranty</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Product Details Tabs */}
        <Reveal className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-200">
            <button
              className={`flex-1 min-w-[110px] py-3 sm:py-4 px-2 text-sm sm:text-base font-bold text-center border-b-2 transition-colors ${
                activeTab === 'description' ? 'border-brand-blue text-brand-blue bg-pink-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`flex-1 min-w-[110px] py-3 sm:py-4 px-2 text-sm sm:text-base font-bold text-center border-b-2 transition-colors ${
                activeTab === 'specifications' ? 'border-brand-blue text-brand-blue bg-pink-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
            <button
              id="reviews"
              className={`flex-1 min-w-[110px] py-3 sm:py-4 px-2 text-sm sm:text-base font-bold text-center border-b-2 transition-colors ${
                activeTab === 'reviews' ? 'border-brand-blue text-brand-blue bg-pink-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.numReviews})
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-slate-600">
                <p className="text-lg leading-relaxed mb-6">{product.description}</p>
                <h3 className="font-bold text-slate-800 text-xl mb-4">All Highlights</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {product.highlights?.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="font-bold text-slate-800 text-xl mb-6">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-xl border border-slate-200">
                  {Object.entries(product.specifications || {}).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex p-4 ${
                        idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                      } border-b border-slate-200 md:border-b-0 md:[&:not(:nth-last-child(-n+2))]:border-b`}
                    >
                      <div className="w-1/3 font-semibold text-slate-700 capitalize">{key}</div>
                      <div className="w-2/3 text-slate-600">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Header Summary & Write Review CTA */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-slate-800 text-2xl mb-1">Customer Reviews</h3>
                    <p className="text-sm text-slate-500">
                      Verified customer feedback and authentic ratings
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-sm w-full text-center">
                    <p className="font-bold mb-1 text-slate-800 text-sm sm:text-base">
                      {eligibility.existingReviewId || eligibility.reason === 'REVIEW_ALREADY_EXISTS'
                        ? 'Already reviewed this product?'
                        : 'Bought this product?'}
                    </p>
                    <p className="text-xs text-slate-500 mb-3.5">
                      {eligibility.existingReviewId || eligibility.reason === 'REVIEW_ALREADY_EXISTS'
                        ? 'You can update your published rating and comments'
                        : 'Share your verified experience with other customers'}
                    </p>

                    <button
                      type="button"
                      disabled={checkingEligibility}
                      onClick={handleWriteReviewClick}
                      className={`w-full px-5 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                        eligibility.existingReviewId || eligibility.reason === 'REVIEW_ALREADY_EXISTS'
                          ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                          : 'bg-brand-blue hover:bg-brand-blueDark text-white shadow-md shadow-blue-500/20 hover:shadow-lg'
                      }`}
                    >
                      {checkingEligibility && <FiLoader className="animate-spin" size={15} />}
                      <span>
                        {eligibility.existingReviewId || eligibility.reason === 'REVIEW_ALREADY_EXISTS'
                          ? 'Edit Your Review'
                          : 'Write a Review'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <RatingBreakdown
                  distribution={reviewsData.summary?.distribution}
                  reviewCount={reviewsData.summary?.reviewCount ?? product.numReviews}
                  averageRating={reviewsData.summary?.averageRating ?? product.rating}
                />

                {/* Reviews List / Error / Empty State */}
                {reviewsLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    <FiLoader className="animate-spin inline-block mr-2" size={20} />
                    <span>Loading verified reviews...</span>
                  </div>
                ) : reviewsError ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
                    <p className="text-sm font-medium mb-3">{reviewsError}</p>
                    <button
                      type="button"
                      onClick={fetchReviews}
                      className="px-4 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiRotateCcw size={13} />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : reviewsData.results?.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.results.map((review) => (
                      <ReviewCard
                        key={review._id}
                        review={review}
                        onEdit={handleEditReviewFromCard}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 mb-1">No reviews yet</p>
                    <p className="text-xs text-slate-400">
                      Be the first verified purchaser to leave a review!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Reveal as="section" className="mt-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">You May Also Like</h2>
            <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <RevealItem key={related._id} className="min-w-0">
                  <ProductCard product={related} />
                </RevealItem>
              ))}
            </RevealStagger>
          </Reveal>
        )}
      </div>

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        initialData={editingReview}
        productName={product?.name}
        loading={submittingReview}
      />
    </>
  );
};

export default ProductDetailPage;