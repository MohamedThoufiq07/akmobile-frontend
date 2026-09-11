import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonImage from './SkeletonImage';
import SkeletonText from './SkeletonText';

/**
 * SearchResultSkeleton
 * Matches SearchResultCard.jsx across responsive breakpoints (horizontal on mobile, grid card on desktop).
 */
const SearchResultSkeleton = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`relative flex flex-row sm:flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[155px] sm:min-h-0 w-full ${className}`}
    >
      {/* Top/Right Wishlist Button placeholder */}
      <div className="absolute top-2.5 right-2.5 sm:top-10 sm:right-3 z-20">
        <Skeleton variant="circular" className="w-7 h-7" />
      </div>

      {/* LEFT SIDE (Mobile) / TOP (Desktop): Image placeholder */}
      <div className="relative w-[115px] xs:w-[125px] sm:w-full shrink-0 bg-slate-50 p-2.5 sm:p-4 sm:pt-[85%] flex items-center justify-center">
        {/* Brand Badge placeholder (Desktop) */}
        <div className="hidden sm:flex absolute top-3 left-3 z-10">
          <Skeleton variant="rounded" className="h-4 w-14" />
        </div>

        {/* Discount Badge placeholder */}
        <div className="absolute top-2 left-2 sm:top-3 sm:right-3 sm:left-auto z-10">
          <Skeleton variant="rounded" className="h-4 w-12" />
        </div>

        <div className="w-full h-full max-h-[120px] sm:max-h-none sm:absolute sm:top-0 sm:left-0 sm:w-full sm:h-full p-2">
          <SkeletonImage aspectRatio="aspect-square" className="w-full h-full rounded-xl" />
        </div>
      </div>

      {/* RIGHT SIDE (Mobile) / BOTTOM (Desktop): Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow min-w-0 justify-between">
        <div>
          {/* Brand & Category row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Skeleton variant="rounded" className="h-3 w-16" />
            <Skeleton variant="rounded" className="h-3 w-20" />
          </div>

          {/* Product Name (2 lines) */}
          <SkeletonText lines={2} lineClassName="h-3.5" gap="gap-1" className="mb-2" />

          {/* Rating & Stock */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="rounded" className="h-3 w-16" />
            <Skeleton variant="rounded" className="h-3 w-12 ml-auto" />
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-2">
            <Skeleton variant="rounded" className="h-5 w-20" />
            <Skeleton variant="rounded" className="h-3 w-12" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="flex-1 h-8 rounded-xl" />
            <Skeleton variant="rounded" className="flex-1 h-8 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SearchResultSkeleton);
