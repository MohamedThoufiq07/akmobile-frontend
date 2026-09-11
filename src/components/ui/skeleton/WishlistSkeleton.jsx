import { memo } from 'react';
import Skeleton from './Skeleton';
import ProductGridSkeleton from './ProductGridSkeleton';

/**
 * WishlistSkeleton
 * Matches WishlistPage.jsx layout during initial authenticated load.
 */
const WishlistSkeleton = () => {
  return (
    <div aria-hidden="true" className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <Skeleton variant="rounded" className="h-8 w-48 mb-2" />
        <Skeleton variant="rounded" className="h-4 w-32" />
      </div>

      {/* Product Grid */}
      <ProductGridSkeleton count={4} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
    </div>
  );
};

export default memo(WishlistSkeleton);
