import { memo } from 'react';
import Skeleton from './Skeleton';

/**
 * Circular skeleton placeholder for avatars, icon buttons, and badges.
 */
const SkeletonCircle = ({ size = 40, className = '', ...props }) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
};

export default memo(SkeletonCircle);
