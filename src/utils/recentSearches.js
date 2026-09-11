const STORAGE_KEY = 'akmobiles_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export const getRecentSearches = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
};

export const saveRecentSearch = (query) => {
  if (!query || typeof query !== 'string') return getRecentSearches();
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();

  if (typeof window === 'undefined' || !window.localStorage) {
    return [trimmed];
  }

  try {
    const existing = getRecentSearches();
    const lower = trimmed.toLowerCase();
    const deduplicated = existing.filter((item) => item.toLowerCase() !== lower);
    const updated = [trimmed, ...deduplicated].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [trimmed];
  }
};

export const removeRecentSearch = (query) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const existing = getRecentSearches();
    const lower = (query || '').toLowerCase().trim();
    const updated = existing.filter((item) => item.toLowerCase() !== lower);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const clearAllRecentSearches = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage clear errors
  }
  return [];
};
