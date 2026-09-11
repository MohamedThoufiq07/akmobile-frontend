import { memo } from 'react';

/**
 * Accessible Page-level / Section-level Skeleton wrapper.
 * Sets aria-busy="true" during loading and provides a single screen-reader announcement.
 */
const PageSkeleton = ({
  children,
  loading = true,
  statusText,
  label,
  className = '',
}) => {
  const accessibleText = label || statusText || 'Loading content, please wait...';
  return (
    <div
      aria-busy={loading}
      className={`relative w-full ${className}`}
    >
      {loading && (
        <span role="status" aria-live="polite" className="sr-only">
          {accessibleText}
        </span>
      )}
      {children}
    </div>
  );
};

export default memo(PageSkeleton);
