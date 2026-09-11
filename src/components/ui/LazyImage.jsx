import { useState, useCallback, memo } from 'react';
import { getPlaceholderSvg } from '../../utils/imageHelper';
import Skeleton from './skeleton/Skeleton';

/**
 * LazyImage Component
 * Displays an aspect-ratio-preserving skeleton placeholder until the image finishes loading.
 * Automatically falls back to a safe SVG placeholder on image load failure without infinite loops.
 */
const LazyImage = ({
  src,
  alt = 'Product Image',
  fallbackText,
  aspectRatio = 'aspect-square',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((e) => {
    if (!hasError) {
      setHasError(true);
      setIsLoaded(true);
      e.target.onerror = null;
      e.target.src = getPlaceholderSvg(fallbackText || alt || 'Product');
    }
  }, [hasError, fallbackText, alt]);

  return (
    <div className={`relative w-full overflow-hidden ${aspectRatio} ${className}`} aria-hidden="true">
      {/* Image-level skeleton until loaded */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none z-10" />
      )}

      {/* Actual Image */}
      <img
        src={src || getPlaceholderSvg(fallbackText || alt || 'Product')}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        {...props}
      />
    </div>
  );
};

export default memo(LazyImage);
