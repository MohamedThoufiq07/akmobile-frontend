import { memo } from 'react';
import Skeleton from './Skeleton';

/**
 * Multi-line typography skeleton placeholder with natural width variation.
 */
const SkeletonText = ({
  lines = 2,
  gap = 'gap-2',
  className = '',
  lineClassName = 'h-3.5',
  widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3'],
}) => {
  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => {
        const widthClass = widths[index % widths.length] || 'w-full';
        return (
          <Skeleton
            key={index}
            variant="rounded"
            className={`${lineClassName} ${widthClass}`}
          />
        );
      })}
    </div>
  );
};

export default memo(SkeletonText);
