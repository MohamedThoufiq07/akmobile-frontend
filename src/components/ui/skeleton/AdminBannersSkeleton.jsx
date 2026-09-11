import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonImage from './SkeletonImage';

/**
 * AdminBannersSkeleton
 * Matches AdminBanners.jsx layout: grid of banner preview cards with action controls.
 */
const AdminBannersSkeleton = () => {
  return (
    <div aria-hidden="true" className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <Skeleton variant="rounded" className="h-5 w-36" />
        <Skeleton variant="rounded" className="h-10 w-32 rounded-lg" />
      </div>

      {/* Grid of Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-4">
            <SkeletonImage aspectRatio="aspect-[21/9]" className="rounded-xl" />
            <div className="flex justify-between items-center">
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="rounded" className="h-4 w-40" />
                <Skeleton variant="rounded" className="h-3 w-28" />
              </div>
              <div className="flex gap-2">
                <Skeleton variant="rounded" className="w-8 h-8 rounded-lg" />
                <Skeleton variant="rounded" className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(AdminBannersSkeleton);
