import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonImage from './SkeletonImage';
import SkeletonText from './SkeletonText';

/**
 * ProductCardSkeleton
 * Precisely matches the dimensions, badges, and layout of ProductCard.jsx.
 */
const ProductCardSkeleton = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`relative flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm ${className}`}
    >
      {/* Top Brand Pill Skeleton */}
      <div className="absolute top-3 left-3 z-10">
        <Skeleton variant="rounded" className="h-5 w-16" />
      </div>

      {/* Top Right Discount Badge Skeleton */}
      <div className="absolute top-3 right-3 z-10">
        <Skeleton variant="rounded" className="h-5 w-14" />
      </div>

      {/* Wishlist Button Skeleton */}
      <div className="absolute top-10 right-3 z-10">
        <Skeleton variant="circular" className="w-7 h-7" />
      </div>

      {/* Product Image Skeleton */}
      <div className="p-4 bg-gradient-to-b from-slate-50 to-white">
        <SkeletonImage aspectRatio="aspect-square" className="rounded-xl" />
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow justify-between border-t border-slate-100">
        <div>
          {/* Title Lines */}
          <SkeletonText lines={2} lineClassName="h-3.5" gap="gap-1.5" className="mb-2" />
          
          {/* Specs / Brand line */}
          <Skeleton variant="rounded" className="h-2.5 w-24 mb-2.5" />

          {/* Rating stars */}
          <div className="flex items-center gap-1 mb-3">
            <Skeleton variant="rounded" className="h-3 w-16" />
            <Skeleton variant="rounded" className="h-2.5 w-8" />
          </div>
        </div>

        {/* Pricing & Buttons */}
        <div className="mt-auto pt-2 border-t border-slate-100/60">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <Skeleton variant="rounded" className="h-5 w-20" />
            <Skeleton variant="rounded" className="h-3.5 w-12" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="flex-1 h-9 rounded-full" />
            <Skeleton variant="rounded" className="flex-1 h-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCardSkeleton);
