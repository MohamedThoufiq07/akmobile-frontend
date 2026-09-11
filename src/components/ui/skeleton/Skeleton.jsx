import { memo } from 'react';

/**
 * Base Skeleton primitive component.
 * Renders an accessible, animated placeholder element matching component boundaries.
 * Automatically respects prefers-reduced-motion.
 */
const Skeleton = ({
  className = '',
  variant = 'rectangular', // 'rectangular' | 'rounded' | 'circular' | 'text'
  width,
  height,
  style = {},
  ...props
}) => {
  const variantClasses = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  }[variant] || 'rounded-lg';

  const inlineStyles = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      className={`bg-slate-200/80 animate-pulse select-none pointer-events-none ${variantClasses} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};

export default memo(Skeleton);
