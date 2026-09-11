import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonText from './SkeletonText';

/**
 * TrackOrderSkeleton
 * Matches the shipment timeline card in TrackOrderPage.jsx while searching.
 */
const TrackOrderSkeleton = () => {
  return (
    <div aria-hidden="true" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6 mt-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
        <div>
          <Skeleton variant="rounded" className="h-6 w-44 mb-2" />
          <Skeleton variant="rounded" className="h-4 w-32" />
        </div>
        <Skeleton variant="rounded" className="h-8 w-36 rounded-full" />
      </div>

      {/* Timeline Steps */}
      <div className="space-y-6 pt-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex gap-4 items-start">
            <Skeleton variant="circular" className="w-8 h-8 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="rounded" className="h-4 w-28" />
              <SkeletonText lines={1} lineClassName="h-3" widths={['w-3/4']} />
              <Skeleton variant="rounded" className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TrackOrderSkeleton);
