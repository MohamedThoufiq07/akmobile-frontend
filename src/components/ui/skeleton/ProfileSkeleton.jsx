import { memo } from 'react';
import Skeleton from './Skeleton';
import SkeletonCircle from './SkeletonCircle';

/**
 * ProfileSkeleton
 * Matches ProfilePage.jsx layout during initial authenticated user load.
 */
const ProfileSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with avatar & name */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 mb-8">
        <SkeletonCircle size={80} className="w-20 h-20 sm:w-24 sm:h-24" />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <Skeleton variant="rounded" className="h-7 w-48 mx-auto sm:mx-0" />
          <Skeleton variant="rounded" className="h-4 w-36 mx-auto sm:mx-0" />
        </div>
        <Skeleton variant="rounded" className="h-10 w-28 rounded-xl" />
      </div>

      {/* Profile Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <Skeleton variant="rounded" className="h-6 w-44 mb-4" />

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

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Skeleton variant="rounded" className="h-11 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default memo(ProfileSkeleton);
