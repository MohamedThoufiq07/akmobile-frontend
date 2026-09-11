import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import api from '../utils/api';
import SearchResultCard from '../components/ui/SearchResultCard';
import { SearchResultSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { normalizeProductsResponse } from '../utils/apiHelper';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const abortController = new AbortController();
    let ignore = false;

    const fetchSearchResults = async () => {
      if (!query) {
        if (!ignore) {
          setProducts([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        const { data } = await api.get('/products/', {
          params: { search: query, limit: 40 },
          signal: abortController.signal,
        });

        if (!ignore) {
          const list = normalizeProductsResponse(data);
          setProducts(list);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }
        if (!ignore) {
          console.error('Error fetching search results:', err);
          setError('Failed to fetch search results. Please check your internet connection and try again.');
          setProducts([]);
          setLoading(false);
        }
      }
    };

    fetchSearchResults();

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, [query, retryCount]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <>
      <Helmet>
        <title>{query ? `Search Results for "${query}" | AK Mobiles` : 'Search Products | AK Mobiles'}</title>
      </Helmet>

      {/* Header Banner */}
      <Reveal className="bg-slate-100 py-6 sm:py-8 border-b border-slate-200">
        <div className="container mx-auto px-4 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5 min-w-0">
            <FiSearch className="text-brand-blue shrink-0" />
            <span className="truncate">Search Results</span>
          </h1>
          {query ? (
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 break-words">
              Showing results for <span className="font-bold text-slate-900">&ldquo;{query}&rdquo;</span>
            </p>
          ) : (
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
              Please type a search query in the search bar above to browse phones, brands, and accessories.
            </p>
          )}
        </div>
      </Reveal>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 min-h-[60vh]">
        {loading ? (
          <PageSkeleton loading={true} statusText="Searching products...">
            <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                <SearchResultSkeleton key={idx} />
              ))}
            </div>
          </PageSkeleton>
        ) : error ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl shadow-sm border border-red-100 max-w-lg mx-auto">
            <FiAlertCircle className="text-red-500 mx-auto text-4xl mb-3" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Search Unavailable</h2>
            <p className="text-slate-600 text-sm mb-6">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blueHover text-white text-sm font-bold rounded-full transition-colors shadow-sm"
            >
              <FiRefreshCw size={16} /> Retry
            </button>
          </div>
        ) : !query ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Start your search</h2>
            <p className="text-slate-500 text-sm">
              Use the search bar above to look for smartphones, earbuds, power banks, chargers, and smart watches.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No products found</h2>
            <p className="text-slate-500 text-sm">
              We couldn't find any products matching &ldquo;{query}&rdquo;. Try checking your spelling or using different keywords.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-slate-500 mb-4 sm:mb-6 font-medium text-xs sm:text-sm">
              Found <span className="font-bold text-slate-800">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
            </p>

            <RevealStagger className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {products.map((product) => (
                <RevealItem key={product._id} className="min-w-0 w-full">
                  <SearchResultCard product={product} />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsPage;
