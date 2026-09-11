import { memo } from 'react';
import { FiClock, FiX, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import { formatPrice } from '../../utils/formatPrice';
import { getPrimaryProductImageUrl, getPlaceholderSvg } from '../../utils/imageHelper';
import Skeleton from '../ui/skeleton/Skeleton';

const SearchDropdown = ({
  isOpen,
  query,
  recentSearches = [],
  suggestions = [],
  loading = false,
  error = null,
  activeIndex = -1,
  onSelectRecent,
  onRemoveRecent,
  onClearAllRecent,
  onSelectSuggestion,
  listboxId = 'search-suggestions-listbox',
}) => {
  if (!isOpen) return null;

  const isQueryEmpty = !query.trim();

  return (
    <div
      id={listboxId}
      role="listbox"
      tabIndex={-1}
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200/90 py-2.5 z-50 max-h-[420px] overflow-y-auto text-left transition-all"
    >
      {isQueryEmpty ? (
        /* RECENT SEARCHES PANEL */
        <div>
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiClock size={13} className="text-slate-400" /> Recent Searches
            </span>
            {recentSearches.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearAllRecent();
                }}
                className="text-[11px] font-semibold text-brand-blue hover:text-pink-600 transition-colors flex items-center gap-1 p-1"
              >
                <FiTrash2 size={12} /> Clear all
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-400 text-xs">
              <FiClock size={24} className="mx-auto mb-2 text-slate-300" />
              No recent searches yet. Search for phones, brands, or accessories.
            </div>
          ) : (
            <ul className="py-1">
              {recentSearches.map((item, index) => {
                const isSelected = activeIndex === index;
                return (
                  <li
                    key={item}
                    id={`recent-item-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelectRecent(item)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs sm:text-sm font-medium transition-colors ${
                      isSelected ? 'bg-pink-50 text-brand-blue font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <FiClock size={14} className={isSelected ? 'text-brand-blue' : 'text-slate-400'} />
                      <span className="truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveRecent(item);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ml-2"
                      aria-label={`Remove search ${item}`}
                    >
                      <FiX size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        /* LIVE PRODUCT SUGGESTIONS PANEL */
        <div>
          <div className="px-4 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiTrendingUp size={13} className="text-slate-400" /> Suggestions
            </span>
            {loading && (
              <span className="text-[11px] text-slate-400 font-medium animate-pulse">
                Searching...
              </span>
            )}
          </div>

          {loading && suggestions.length === 0 ? (
            <div className="p-3.5 space-y-3" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <Skeleton variant="rounded" className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-grow space-y-1.5 min-w-0">
                    <Skeleton variant="rounded" className="h-3 w-16" />
                    <Skeleton variant="rounded" className="h-3.5 w-3/4" />
                    <Skeleton variant="rounded" className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-slate-500 text-xs">
              <p className="text-red-500 font-medium mb-1">Could not load suggestions</p>
              <p className="text-slate-400">Press Enter to search for &ldquo;{query}&rdquo;</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-xs">
              <p className="font-semibold text-slate-700 mb-1">No products found</p>
              <p className="text-slate-400">Press Enter to view all results</p>
            </div>
          ) : (
            <ul className="py-1 divide-y divide-slate-50">
              {suggestions.map((product, index) => {
                const isSelected = activeIndex === index;

                return (
                  <li
                    key={product._id}
                    id={`suggestion-item-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelectSuggestion(product)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-pink-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={getPrimaryProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderSvg(product.name || product.brand || 'Product');
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">
                          {product.brand}
                        </span>
                        {product.category && (
                          <span className="text-[10px] text-slate-400 truncate">
                            • {product.category}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs font-semibold text-slate-800 truncate leading-snug"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-900">
                          {formatPrice(product.offerPrice)}
                        </span>
                        {product.originalPrice > product.offerPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(SearchDropdown);
