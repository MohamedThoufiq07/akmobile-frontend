/**
 * Sanitizes image URLs to prevent Mixed Content, CORS, and net::ERR_CONNECTION_REFUSED
 * errors for localhost, private-network, or invalid HTTP mock URLs in production.
 */
export const getPlaceholderSvg = (text = 'Product') => {
  const label = String(text || 'Product').replace(/[<>&"]/g, '').slice(0, 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="600" fill="#64748b">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getValidImageUrl = (url, fallbackText = 'Product') => {
  const fallback = getPlaceholderSvg(fallbackText);

  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'img/1.jpg' ||
    trimmed.includes('img/1.jpg') ||
    trimmed.includes('http://img') ||
    trimmed.startsWith('//img')
  ) {
    return fallback;
  }

  // Handle data URIs or relative static paths safely
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }

  try {
    const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isClientRemote =
      typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const hostname = parsed.hostname.toLowerCase();

    // Check if hostname is localhost, loopback, or private IP
    const isLocalOrPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      (hostname.startsWith('172.') &&
        parseInt(hostname.split('.')[1], 10) >= 16 &&
        parseInt(hostname.split('.')[1], 10) <= 31);

    // In production/remote environments, reject localhost/private IP URLs immediately
    if (isLocalOrPrivate && (isClientRemote || isClientHttps)) {
      return fallback;
    }

    // In localhost dev, if pointing to dead/mock ports like 7070 or 37857, also reject
    if (isLocalOrPrivate && parsed.port && !['5173', '8000', '5000', '3000'].includes(parsed.port)) {
      return fallback;
    }

    // In HTTPS environments, reject insecure non-HTTPS or upgrade if safe
    if (isClientHttps && parsed.protocol === 'http:') {
      if (isLocalOrPrivate) {
        return fallback;
      }
      parsed.protocol = 'https:';
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return fallback;
  }
};
