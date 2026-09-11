import { memo } from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

/**
 * ProductGridSkeleton
 * Responsive grid of ProductCardSkeleton components matching Shop/Home page layouts.
 */
const ProductGridSkeleton = ({
  count = 8,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  gap = 'gap-4 md:gap-6',
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`grid ${columns} ${gap} ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="min-w-0 w-full">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
};

export default memo(ProductGridSkeleton);
