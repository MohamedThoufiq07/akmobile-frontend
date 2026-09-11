import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonText from './SkeletonText';

/**
 * OrderDetailSkeleton
 * Matches OrderDetailPage.jsx layout during initial order load.
 */
const OrderDetailSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back button */}
      <Skeleton variant="rounded" className="h-5 w-28 mb-6" />

      {/* Main Order Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <Skeleton variant="rounded" className="h-7 w-56 mb-2" />
            <Skeleton variant="rounded" className="h-4 w-44" />
          </div>
          <Skeleton variant="rounded" className="h-10 w-36 rounded-xl" />
        </div>

        {/* Tracking Stepper Placeholder */}
        <div className="py-6 px-4">
          <div className="flex justify-between items-center relative">
            <Skeleton variant="rounded" className="h-1 w-full absolute top-1/2 -translate-y-1/2 z-0" />
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                <Skeleton variant="circular" className="w-8 h-8" />
                <Skeleton variant="rounded" className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items in Order (2 columns) */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <Skeleton variant="rounded" className="h-6 w-36 mb-4" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
              <Skeleton variant="rounded" className="w-16 h-16 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonText lines={1} lineClassName="h-4" widths={['w-3/4']} />
                <Skeleton variant="rounded" className="h-3 w-20" />
              </div>
              <Skeleton variant="rounded" className="h-5 w-16" />
            </div>
          ))}
        </div>

        {/* Payment & Shipping Summary (1 column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <Skeleton variant="rounded" className="h-5 w-32 mb-3" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="rounded" className="h-3.5 w-16" />
                <Skeleton variant="rounded" className="h-3.5 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton variant="rounded" className="h-3.5 w-20" />
                <Skeleton variant="rounded" className="h-3.5 w-12" />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <Skeleton variant="rounded" className="h-5 w-16" />
                <Skeleton variant="rounded" className="h-5 w-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-2">
            <Skeleton variant="rounded" className="h-5 w-36 mb-3" />
            <SkeletonText lines={3} lineClassName="h-3.5" widths={['w-full', 'w-4/5', 'w-2/3']} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OrderDetailSkeleton);
