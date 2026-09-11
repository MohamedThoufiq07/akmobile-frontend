import { memo } from 'react';
import Skeleton from './Skeleton';
import TableSkeleton from './TableSkeleton';

/**
 * AdminDashboardSkeleton
 * Matches AdminDashboard.jsx layout: 4 metric cards + revenue area chart box + recent orders table.
 */
const AdminDashboardSkeleton = () => {
  return (
    <div aria-hidden="true" className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
          >
            <Skeleton variant="rounded" className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="rounded" className="h-3.5 w-20" />
              <Skeleton variant="rounded" className="h-6 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="rounded" className="h-5 w-40" />
          <Skeleton variant="rounded" className="h-4 w-28" />
        </div>
        <Skeleton variant="rounded" className="h-64 w-full rounded-xl" />
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="rounded" className="h-5 w-32" />
          <Skeleton variant="rounded" className="h-4 w-20" />
        </div>
        <TableSkeleton rows={4} columns={5} />
      </div>
    </div>
  );
};

export default memo(AdminDashboardSkeleton);
