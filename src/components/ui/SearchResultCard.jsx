import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import { formatPrice } from '../../utils/formatPrice';
import { getPrimaryProductImageUrl, getPlaceholderSvg } from '../../utils/imageHelper';
import RatingStars from './RatingStars';

const BRAND_ACCENT = {
  'Apple': { border: '#6B7280', bg: '#F3F4F6', text: '#374151' },
  'Samsung': { border: '#2563EB', bg: '#DBEAFE', text: '#1D4ED8' },
  'Xiaomi': { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Redmi': { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Mi': { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'OnePlus': { border: '#EF4444', bg: '#FEE2E2', text: '#DC2626' },
  'Vivo': { border: '#7C3AED', bg: '#EDE9FE', text: '#6D28D9' },
  'Oppo': { border: '#10B981', bg: '#D1FAE5', text: '#059669' },
  'Realme': { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  'Nokia': { border: '#1D4ED8', bg: '#DBEAFE', text: '#1E40AF' },
  'Nothing': { border: '#374151', bg: '#F3F4F6', text: '#1F2937' },
  'Motorola': { border: '#1E3A8A', bg: '#DBEAFE', text: '#1E3A8A' },
  'Google': { border: '#4285F4', bg: '#DBEAFE', text: '#1D4ED8' },
  'Google Pixel': { border: '#4285F4', bg: '#DBEAFE', text: '#1D4ED8' },
  'POCO': { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  'iQOO': { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Honor': { border: '#0EA5E9', bg: '#E0F2FE', text: '#0284C7' },
  'Spigen': { border: '#475569', bg: '#F1F5F9', text: '#334155' },
  'Anker': { border: '#0284C7', bg: '#E0F2FE', text: '#0369A1' },
  'boAt': { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
  'Sony': { border: '#1E293B', bg: '#F1F5F9', text: '#0F172A' },
};

const getAccent = (brand) => {
  return BRAND_ACCENT[brand] || { border: '#94A3B8', bg: '#F1F5F9', text: '#475569' };
};

const SearchResultCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  if (!product) return null;

  const isWished = isInWishlist(product._id);
  const accent = getAccent(product.brand);
  const savings = (product.originalPrice || 0) - (product.offerPrice || 0);
  const emiAmount = product.offerPrice >= 3000 ? Math.round(product.offerPrice / 12) : 0;
  const isOutOfStock = product.stock <= 0;

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
      navigate('/checkout');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      data-testid="search-result-card"
      className="group relative flex flex-row sm:flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer min-h-[155px] sm:min-h-0 w-full"
      style={{ borderTopColor: accent.border }}
    >
      {/* Wishlist icon */}
      <button
        type="button"
        onClick={handleWishlist}
        aria-label="Toggle Wishlist"
        className="absolute top-2.5 right-2.5 sm:top-10 sm:right-3 z-20 p-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none min-h-[32px] min-w-[32px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
      >
        {isWished ? <FaHeart className="text-red-500" size={14} /> : <FiHeart size={14} />}
      </button>

      {/* LEFT SIDE (Mobile) / TOP (Desktop): Product Image Container */}
      <div className="relative w-[115px] xs:w-[125px] sm:w-full shrink-0 bg-slate-50/70 sm:bg-gradient-to-b sm:from-slate-50 sm:to-white flex items-center justify-center p-2.5 sm:p-4 sm:pt-[85%] overflow-hidden">
        {/* Brand Badge (Desktop view) */}
        <div className="hidden sm:flex absolute top-3 left-3 z-10 items-center">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
            style={{ backgroundColor: accent.bg, color: accent.text }}
          >
            {product.brand || 'AK'}
          </span>
        </div>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:right-3 sm:left-auto z-10 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg shadow-sm sm:shadow-md">
            {product.discount}% OFF
          </div>
        )}

        <img
          src={getPrimaryProductImageUrl(product)}
          alt={product.name}
          className="w-full h-full max-h-[130px] sm:max-h-none sm:absolute sm:top-0 sm:left-0 sm:w-full sm:h-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getPlaceholderSvg(product.name || product.brand || 'Product');
          }}
        />
      </div>

      {/* RIGHT SIDE (Mobile) / BOTTOM (Desktop): Product Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow min-w-0 justify-between">
        <div>
          {/* Brand & Category line */}
          <div className="flex items-center gap-1.5 mb-1 pr-8 sm:pr-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
              {product.brand}
            </span>
            {product.category && (
              <>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  {product.category}
                </span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3
            className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight sm:leading-snug mb-1.5 group-hover:text-brand-blue transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Ratings & Reviews */}
          <div className="flex items-center gap-1 mb-1.5">
            <RatingStars rating={product.rating || 0} />
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              ({product.numReviews || 0})
            </span>
            {isOutOfStock ? (
              <span className="ml-auto sm:ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                Out of Stock
              </span>
            ) : (
              <span className="ml-auto sm:ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-2 pt-2 border-t border-slate-100/80">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatPrice(product.offerPrice)}
            </span>
            {product.originalPrice > product.offerPrice && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {savings > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 hidden xs:inline">
                Save {formatPrice(savings)}
              </span>
            )}
          </div>

          {/* EMI */}
          {emiAmount > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">
              EMI from <span className="font-semibold text-slate-600">{formatPrice(emiAmount)}</span>/mo
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-1.5 px-2.5 min-h-[38px] sm:min-h-[40px] rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs transition-all duration-200 ${
                !isOutOfStock
                  ? 'border border-brand-blue text-brand-blue bg-pink-50/40 hover:bg-brand-blue hover:text-white active:scale-[0.98]'
                  : 'border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <FiShoppingCart size={13} className="shrink-0" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </button>

            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-1.5 px-2.5 min-h-[38px] sm:min-h-[40px] rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blueHover hover:to-purple-700 text-white shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]"
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SearchResultCard);
