import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiZap } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatPrice';
import RatingStars from './RatingStars';

import { getValidImageUrl } from '../../utils/imageHelper';

// Brand accent colors for card borders & pills
const BRAND_ACCENT = {
  'Apple':     { border: '#6B7280', bg: '#F3F4F6', text: '#374151' },
  'Samsung':   { border: '#2563EB', bg: '#DBEAFE', text: '#1D4ED8' },
  'Xiaomi':    { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Redmi':     { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Mi':        { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'OnePlus':   { border: '#EF4444', bg: '#FEE2E2', text: '#DC2626' },
  'Vivo':      { border: '#7C3AED', bg: '#EDE9FE', text: '#6D28D9' },
  'Oppo':      { border: '#10B981', bg: '#D1FAE5', text: '#059669' },
  'Realme':    { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  'Nokia':     { border: '#1D4ED8', bg: '#DBEAFE', text: '#1E40AF' },
  'Nothing':   { border: '#374151', bg: '#F3F4F6', text: '#1F2937' },
  'Motorola':  { border: '#1E3A8A', bg: '#DBEAFE', text: '#1E3A8A' },
  'Google':    { border: '#4285F4', bg: '#DBEAFE', text: '#1D4ED8' },
  'Google Pixel': { border: '#4285F4', bg: '#DBEAFE', text: '#1D4ED8' },
  'POCO':      { border: '#EAB308', bg: '#FEF9C3', text: '#A16207' },
  'iQOO':      { border: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
  'Honor':     { border: '#0EA5E9', bg: '#E0F2FE', text: '#0284C7' },
};

const getAccent = (brand) => {
  return BRAND_ACCENT[brand] || { border: '#94A3B8', bg: '#F1F5F9', text: '#475569' };
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const isWished = isInWishlist(product._id);
  const accent = getAccent(product.brand);
  const savings = product.originalPrice - product.offerPrice;
  const emiAmount = Math.round(product.offerPrice / 12);

  // Build specs string from specifications object
  const specsStr = product.specifications
    ? [product.specifications.ram, product.specifications.storage, product.specifications.processor]
        .filter(Boolean)
        .join(' | ')
    : '';

  return (
    <div
      className="group relative flex flex-col h-full bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl rounded-2xl overflow-hidden"
      style={{ borderTop: `3px solid ${accent.border}` }}
    >
      {/* Discount Badge — top right */}
      {product.discount > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md">
          {product.discount}% OFF
        </div>
      )}

      {/* Brand pill — top left */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
          style={{ backgroundColor: accent.bg, color: accent.text }}
        >
          {product.brand}
        </span>
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-10 right-3 z-10 p-1.5 rounded-full bg-white/90 shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
        aria-label="Toggle Wishlist"
      >
        {isWished ? <FaHeart className="text-red-500" size={14} /> : <FiHeart size={14} />}
      </button>

      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="block relative pt-[100%] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <img
          src={getValidImageUrl(product.images?.[0]?.url, product.name)}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x500/f1f5f9/64748b?text=${encodeURIComponent(product.brand)}`;
          }}
        />
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow min-w-0 border-t border-slate-100">

        {/* Product Name */}
        <Link to={`/products/${product._id}`} className="block group-hover:text-brand-blue transition-colors">
          <h3 className="font-bold text-slate-800 line-clamp-2 text-sm h-10 mb-1.5" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Specs line */}
        {specsStr && (
          <p className="text-[11px] text-slate-400 truncate mb-2" title={specsStr}>
            {specsStr}
          </p>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center mb-2">
          <RatingStars rating={product.rating} />
          <span className="text-[11px] text-slate-500 ml-1.5">({product.numReviews})</span>
        </div>

        {/* Pricing */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-extrabold text-lg text-slate-900">{formatPrice(product.offerPrice)}</span>
            {product.originalPrice > product.offerPrice && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          {/* Savings */}
          {savings > 0 && (
            <p className="text-[11px] text-emerald-600 font-semibold mb-1">
              You save {formatPrice(savings)}
            </p>
          )}

          {/* EMI */}
          {emiAmount > 0 && (
            <p className="text-[10px] text-slate-400 mb-3">
              EMI from <span className="font-semibold text-slate-500">{formatPrice(emiAmount)}</span>/mo
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`flex-1 min-w-0 py-2 min-h-[40px] rounded-full flex items-center justify-center gap-1.5 font-semibold text-xs transition-all duration-300
                ${product.stock > 0
                  ? 'border border-brand-blue text-brand-blue bg-white hover:bg-brand-blue hover:text-white active:scale-[0.97]'
                  : 'border border-slate-200 text-slate-400 bg-white cursor-not-allowed'
                }`}
            >
              <FiShoppingCart size={14} />
              {product.stock > 0 ? 'Add' : 'Out of Stock'}
            </button>

            {product.stock > 0 && (
              <button
                onClick={handleBuyNow}
                className="flex-1 min-w-0 py-2 min-h-[40px] rounded-full flex items-center justify-center font-semibold text-xs bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blueHover hover:to-purple-700 text-white hover:scale-105 hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 shadow-sm"
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

export default memo(ProductCard);
