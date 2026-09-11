import { memo } from 'react';
import { FiImage } from 'react-icons/fi';
import Skeleton from './Skeleton';

/**
 * Aspect-ratio preserving image box skeleton with subtle icon.
 */
const SkeletonImage = ({
  aspectRatio = 'aspect-square', // e.g. 'aspect-square', 'aspect-video', 'aspect-[4/3]'
  className = '',
  showIcon = true,
  children,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full ${aspectRatio} bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center ${className}`}
    >
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      {showIcon && (
        <FiImage
          className="relative z-10 text-slate-300 animate-pulse"
          size={28}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};

export default memo(SkeletonImage);
