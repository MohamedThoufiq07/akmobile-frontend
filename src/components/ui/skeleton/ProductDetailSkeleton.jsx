import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonImage from './SkeletonImage';
import SkeletonText from './SkeletonText';

/**
 * ProductDetailSkeleton
 * Matches ProductDetailPage.jsx layout:
 * - Desktop: Vertical thumbnail column + main image box on left, details on right.
 * - Mobile: Main image box + horizontal thumbnail strip, details below.
 */
const ProductDetailSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-12 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        {/* Left Column: Image Gallery */}
        <div className="lg:w-1/2 min-w-0 flex flex-col md:flex-row gap-4 items-start">
          {/* Thumbnails: Column on Desktop (order-1), Row on Mobile (order-2) */}
          <div className="order-2 md:order-1 flex md:flex-col items-center gap-2 w-full md:w-20 shrink-0 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl" />
            ))}
          </div>

          {/* Main Image Container */}
          <div className="order-1 md:order-2 flex-1 w-full bg-slate-50/50 rounded-2xl p-4 md:p-8 border border-slate-100">
            <SkeletonImage aspectRatio="aspect-square" className="w-full h-full rounded-2xl" />
          </div>
        </div>

        {/* Right Column: Product Information */}
        <div className="lg:w-1/2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Category badges */}
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" className="h-5 w-20" />
              <Skeleton variant="rounded" className="h-4 w-28" />
            </div>

            {/* Product Title */}
            <SkeletonText lines={2} lineClassName="h-6 md:h-7" gap="gap-2" widths={['w-full', 'w-4/5']} />

            {/* Rating and Reviews */}
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" className="h-4 w-24" />
              <Skeleton variant="rounded" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-4 w-20" />
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-baseline gap-3">
                <Skeleton variant="rounded" className="h-8 w-32" />
                <Skeleton variant="rounded" className="h-5 w-20" />
                <Skeleton variant="rounded" className="h-5 w-24" />
              </div>
              <Skeleton variant="rounded" className="h-4 w-36" />
            </div>

            {/* Highlights Box */}
            <div className="space-y-2 pt-2">
              <Skeleton variant="rounded" className="h-4 w-28 mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} variant="rounded" className="h-8 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          {/* Quantity and CTA Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <Skeleton variant="rounded" className="h-10 w-32 rounded-xl" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton variant="rounded" className="flex-1 h-12 rounded-full" />
              <Skeleton variant="rounded" className="flex-1 h-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductDetailSkeleton);
