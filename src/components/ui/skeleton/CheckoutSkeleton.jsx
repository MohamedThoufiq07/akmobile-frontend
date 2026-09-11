import { memo } from 'react';
import Skeleton from './Skeleton';

/**
 * CheckoutSkeleton
 * Matches CheckoutPage.jsx layout during initial account pre-fill and pricing calculation.
 */
const CheckoutSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <Skeleton variant="rounded" className="h-8 w-48 mb-2" />
        <Skeleton variant="rounded" className="h-4 w-36" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Shipping Address Form */}
        <div className="lg:w-2/3 w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <Skeleton variant="rounded" className="h-6 w-44 mb-4" />

          {/* Form input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-4 w-24" />
              <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-4 w-28" />
              <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton variant="rounded" className="h-4 w-32" />
            <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-4 w-20" />
              <Skeleton variant="rounded" className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3 w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <Skeleton variant="rounded" className="h-6 w-36 mb-4" />

          {/* Mini items list */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <Skeleton variant="rounded" className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton variant="rounded" className="h-3.5 w-32" />
                  <Skeleton variant="rounded" className="h-3 w-16" />
                </div>
                <Skeleton variant="rounded" className="h-4 w-14" />
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-2.5 pb-4 border-b border-slate-100">
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-16" />
              <Skeleton variant="rounded" className="h-4 w-14" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-20" />
              <Skeleton variant="rounded" className="h-4 w-14" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="h-4 w-12" />
              <Skeleton variant="rounded" className="h-4 w-14" />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Skeleton variant="rounded" className="h-6 w-20" />
            <Skeleton variant="rounded" className="h-6 w-24" />
          </div>

          <Skeleton variant="rounded" className="h-12 w-full rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
};

export default memo(CheckoutSkeleton);
