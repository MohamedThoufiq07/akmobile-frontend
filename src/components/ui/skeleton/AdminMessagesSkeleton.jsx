import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonText from './SkeletonText';

/**
 * AdminMessagesSkeleton
 * Matches AdminMessages.jsx layout: list of contact message cards with subject, sender, and snippet.
 */
const AdminMessagesSkeleton = () => {
  return (
    <div aria-hidden="true" className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton variant="rounded" className="h-5 w-48" />
              <Skeleton variant="rounded" className="h-4 w-36" />
            </div>
            <Skeleton variant="rounded" className="h-3 w-28" />
          </div>
          <SkeletonText lines={2} lineClassName="h-3.5" gap="gap-1.5" widths={['w-full', 'w-4/5']} />
        </div>
      ))}
    </div>
  );
};

export default memo(AdminMessagesSkeleton);
