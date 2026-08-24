/**
 * Sanitizes image URLs to prevent net::ERR_NAME_NOT_RESOLVED console errors
 * for invalid mock domains like http://img/1.jpg.
 */
export const getValidImageUrl = (url, fallbackText = 'Product') => {
  if (!url || typeof url !== 'string') {
    return `https://placehold.co/400x500/f1f5f9/64748b?text=${encodeURIComponent(fallbackText)}`;
  }
  
  const trimmed = url.trim();
  if (
    trimmed === 'img/1.jpg' ||
    trimmed.includes('img/1.jpg') ||
    trimmed.includes('http://img') ||
    trimmed.startsWith('//img')
  ) {
    return `https://placehold.co/400x500/f1f5f9/64748b?text=${encodeURIComponent(fallbackText)}`;
  }
  
  return trimmed;
};
