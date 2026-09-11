import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonText from './SkeletonText';

/**
 * OrderCardSkeleton
 * Matches order cards in MyOrdersPage.jsx.
 */
const OrderCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"
    >
      {/* Order Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <Skeleton variant="rounded" className="h-3 w-16 mb-1.5" />
            <Skeleton variant="rounded" className="h-4 w-28" />
          </div>
          <div>
            <Skeleton variant="rounded" className="h-3 w-16 mb-1.5" />
            <Skeleton variant="rounded" className="h-4 w-20" />
          </div>
          <div>
            <Skeleton variant="rounded" className="h-3 w-16 mb-1.5" />
            <Skeleton variant="rounded" className="h-4 w-24" />
          </div>
        </div>
        <Skeleton variant="rounded" className="h-9 w-28 rounded-xl shrink-0" />
      </div>

      {/* Order Body / Items */}
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton variant="rounded" className="h-5 w-24 rounded-full mb-2" />

        <div className="flex items-center gap-4">
          <Skeleton variant="rounded" className="w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonText lines={1} lineClassName="h-4" widths={['w-2/3']} />
            <Skeleton variant="rounded" className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OrderCardSkeleton);
