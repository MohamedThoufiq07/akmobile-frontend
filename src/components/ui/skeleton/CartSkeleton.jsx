import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonText from './SkeletonText';

/**
 * CartSkeleton
 * Matches Cart.jsx layout: item rows on the left, sticky summary card on the right.
 */
const CartSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <Skeleton variant="rounded" className="h-8 w-48 mb-2" />
        <Skeleton variant="rounded" className="h-4 w-32" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:w-2/3 w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm"
            >
              {/* Product Thumbnail */}
              <Skeleton variant="rounded" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
                <SkeletonText lines={2} lineClassName="h-4" gap="gap-1.5" widths={['w-3/4', 'w-1/2']} />
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Skeleton variant="rounded" className="h-5 w-20" />
                  <Skeleton variant="rounded" className="h-4 w-16" />
                </div>
                <Skeleton variant="rounded" className="h-4 w-24" />
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton variant="rounded" className="h-9 w-28 rounded-xl" />
                <Skeleton variant="circular" className="w-8 h-8" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3 w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <Skeleton variant="rounded" className="h-6 w-36 mb-4" />
          
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-20" />
              <Skeleton variant="rounded" className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-28" />
              <Skeleton variant="rounded" className="h-4 w-14" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-4 w-16" />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Skeleton variant="rounded" className="h-6 w-24" />
            <Skeleton variant="rounded" className="h-6 w-28" />
          </div>

          <Skeleton variant="rounded" className="h-12 w-full rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
};

export default memo(CartSkeleton);
