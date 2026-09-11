import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../utils/api';
import ProductCard from '../components/ui/ProductCard';
import { ProductGridSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { BRANDS, CATEGORIES, SORT_OPTIONS } from '../utils/constants';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  
  // State for products and pagination
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') ? searchParams.get('brand').split(',') : [],
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    discount: searchParams.get('discount') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') ? searchParams.get('brand').split(',') : [];

  const [prevParamsKey, setPrevParamsKey] = useState(() => `${categoryParam}|${brandParam.join(',')}`);
  const currentParamsKey = `${categoryParam}|${brandParam.join(',')}`;

  if (currentParamsKey !== prevParamsKey) {
    setPrevParamsKey(currentParamsKey);
    setPage(1);
    setFilters(prev => ({ ...prev, category: categoryParam, brand: brandParam }));
  }

  // Fetch products when filters, page, or retryCount changes
  useEffect(() => {
    let ignore = false;
    let queryParams = `?page=${page}&limit=12`;
    
    if (filters.brand.length > 0) queryParams += `&brand=${filters.brand.join(',')}`;
    if (filters.category) queryParams += `&category=${filters.category}`;
    if (filters.minPrice) queryParams += `&minPrice=${filters.minPrice}`;
    if (filters.maxPrice) queryParams += `&maxPrice=${filters.maxPrice}`;
    if (filters.discount) queryParams += `&discount=${filters.discount}`;
    if (filters.rating) queryParams += `&rating=${filters.rating}`;
    if (filters.sort) queryParams += `&sort=${filters.sort}`;

    api.get(`/products${queryParams}`)
      .then(({ data }) => {
        if (!ignore) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
          setTotalPages(data?.pages || 1);
          setTotalProducts(data?.total || 0);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Error fetching products:', err);
          setError(err.response?.data?.message || 'Failed to load products. Please check your connection and try again.');
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, filters, retryCount]);

  // Handle filter changes
  const handleBrandChange = (brand) => {
    setFilters(prev => {
      const newBrands = prev.brand.includes(brand)
        ? prev.brand.filter(b => b !== brand)
        : [...prev.brand, brand];
      return { ...prev, brand: newBrands };
    });
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
    setPage(1);
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyPriceFilter = () => {
    setPage(1);
    // Force re-render/fetch by creating a new object reference
    setFilters(prev => ({ ...prev }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      brand: [],
      category: '',
      minPrice: '',
      maxPrice: '',
      discount: '',
      rating: '',
      sort: 'newest'
    });
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>All Products | AK Mobiles</title>
        <meta name="description" content="Browse our wide selection of smartphones and accessories." />
      </Helmet>

      {/* Page Header */}
      <Reveal className="bg-slate-100 py-8 border-b border-slate-200">
        <div className="container mx-auto px-4 min-w-0">
          <h1 className="text-3xl font-bold text-slate-800">Shop All Products</h1>
          <p className="text-slate-500 mt-2">Showing {products.length} of {totalProducts} products</p>
        </div>
      </Reveal>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-4 border border-slate-100">
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 font-semibold text-slate-800"
            >
              <FiFilter /> Filter Products
            </button>
            
            <select 
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Sidebar / Filters */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto lg:relative lg:w-1/4 lg:transform-none lg:shadow-none lg:bg-transparent lg:z-auto lg:overflow-visible
            ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-6 lg:p-0 bg-white lg:bg-transparent rounded-xl lg:rounded-none">
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold text-slate-800">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="text-slate-500 hover:text-red-500">
                  <FiX size={24} />
                </button>
              </div>

              {/* Clear Filters */}
              {(filters.brand.length > 0 || filters.category || filters.minPrice || filters.maxPrice) && (
                <button 
                  onClick={clearFilters}
                  className="w-full mb-6 py-2 text-sm text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              )}

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-850 mb-4 pb-2 border-b border-slate-100">Category</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cat-all"
                      name="category"
                      value=""
                      checked={filters.category === ''}
                      onChange={handleCategoryChange}
                      className="w-4 h-4 text-brand-blue focus:ring-brand-blue border-slate-300"
                    />
                    <label htmlFor="cat-all" className="ml-3 text-sm text-slate-600 hover:text-slate-800 cursor-pointer">All Categories</label>
                  </div>
                  {CATEGORIES.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={`cat-${category}`}
                        name="category"
                        value={category}
                        checked={filters.category === category}
                        onChange={handleCategoryChange}
                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue border-slate-300"
                      />
                      <label htmlFor={`cat-${category}`} className="ml-3 text-sm text-slate-650 hover:text-slate-800 cursor-pointer">{category}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-850 mb-4 pb-2 border-b border-slate-100">Brand</h3>
                <div className="space-y-2">
                  {BRANDS.map(brand => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={filters.brand.includes(brand)}
                        onChange={() => handleBrandChange(brand)}
                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue border-slate-300 rounded"
                      />
                      <label htmlFor={`brand-${brand}`} className="ml-3 text-sm text-slate-650 hover:text-slate-800 cursor-pointer">{brand}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Filter */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-850 mb-4 pb-2 border-b border-slate-100">Discount</h3>
                <div className="space-y-2">
                  {[
                    { label: 'All Discounts', value: '' },
                    { label: '10% Off or more', value: '10' },
                    { label: '25% Off or more', value: '25' },
                    { label: '35% Off or more', value: '35' },
                    { label: '50% Off or more', value: '50' },
                    { label: '60% Off or more', value: '60' },
                    { label: '70% Off or more', value: '70' }
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center">
                      <input
                        type="radio"
                        id={`discount-${opt.value || 'all'}`}
                        name="discount"
                        value={opt.value}
                        checked={filters.discount === opt.value}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, discount: e.target.value }));
                          setPage(1);
                        }}
                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue border-slate-300"
                      />
                      <label htmlFor={`discount-${opt.value || 'all'}`} className="ml-3 text-sm text-slate-650 hover:text-slate-800 cursor-pointer select-none">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-850 mb-4 pb-2 border-b border-slate-100">Customer Rating</h3>
                <div className="space-y-2">
                  {[
                    { label: 'All Ratings', value: '' },
                    { label: '4★ & above', value: '4' },
                    { label: '3★ & above', value: '3' },
                    { label: '2★ & above', value: '2' },
                    { label: '1★ & above', value: '1' }
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center">
                      <input
                        type="radio"
                        id={`rating-${opt.value || 'all'}`}
                        name="rating"
                        value={opt.value}
                        checked={filters.rating === opt.value}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, rating: e.target.value }));
                          setPage(1);
                        }}
                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue border-slate-300"
                      />
                      <label htmlFor={`rating-${opt.value || 'all'}`} className="ml-3 text-sm text-slate-650 hover:text-slate-800 cursor-pointer select-none">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              {(() => {
                const minVal = Number(filters.minPrice) || 0;
                const maxVal = Number(filters.maxPrice) || 200000;
                const minPercent = (minVal / 200000) * 100;
                const maxPercent = (maxVal / 200000) * 100;

                return (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 select-none">
                      <h3 className="font-bold text-slate-850 uppercase tracking-wider text-xs">Price</h3>
                      {(filters.minPrice || filters.maxPrice) && (
                        <button 
                          onClick={() => {
                            setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
                            setPage(1);
                          }}
                          className="text-xs font-bold text-brand-blue hover:underline uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    {/* Native HTML Dual Range Slider */}
                    <div className="mb-6 px-1">
                      <div className="slider-container">
                        <div className="slider-track" />
                        <div 
                          className="slider-range" 
                          style={{ 
                            left: `${minPercent}%`, 
                            width: `${maxPercent - minPercent}%` 
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          name="minPrice"
                          value={minVal}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value), maxVal - 5000);
                            setFilters(prev => ({ ...prev, minPrice: val.toString() }));
                          }}
                          className="thumb-input"
                        />
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          name="maxPrice"
                          value={maxVal}
                          onChange={(e) => {
                            const val = Math.max(Number(e.target.value), minVal + 5000);
                            setFilters(prev => ({ ...prev, maxPrice: val.toString() }));
                          }}
                          className="thumb-input"
                        />
                      </div>
                      
                      {/* Dots underneath slider representing steps */}
                      <div className="flex justify-between px-1.5 -mt-1 select-none">
                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="w-[3px] h-[3px] rounded-full bg-slate-350" />
                        ))}
                      </div>

                      {/* Current range text below slider */}
                      <div className="flex justify-between text-[11px] text-slate-500 mt-2 px-1 select-none font-semibold">
                        <span>₹{minVal.toLocaleString('en-IN')}</span>
                        <span>₹{maxVal.toLocaleString('en-IN')}{maxVal >= 200000 ? '+' : ''}</span>
                      </div>
                    </div>

                    {/* Editable Price Inputs */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={handlePriceChange}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand-blue text-slate-700"
                      />
                      
                      <span className="text-slate-400 text-xs">to</span>
                      
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={handlePriceChange}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand-blue text-slate-700"
                      />
                    </div>
                    
                    <button 
                      onClick={applyPriceFilter}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition-colors"
                    >
                      Apply Price
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Mobile Overlay */}
          {isFilterOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            ></div>
          )}

          {/* Product Grid */}
          <div className="lg:w-3/4">
            
            {/* Desktop Sort Bar */}
            <Reveal className="hidden lg:flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
              <span className="text-slate-500 text-sm font-medium min-w-0 truncate">
                Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, totalProducts)} of {totalProducts} Products
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <label className="text-sm font-semibold text-slate-700">Sort by:</label>
                <select 
                  value={filters.sort}
                  onChange={handleSortChange}
                  className="input-field py-1.5 w-auto text-sm"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </Reveal>

            {/* Brand Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              {['All', 'Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Vivo', 'Oppo', 'Realme', 'Nokia', 'Nothing', 'Motorola'].map(tab => {
                const isActive = tab === 'All'
                  ? filters.brand.length === 0
                  : filters.brand.length === 1 && filters.brand[0] === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'All') {
                        setFilters(prev => ({ ...prev, brand: [] }));
                      } else {
                        setFilters(prev => ({ ...prev, brand: [tab] }));
                      }
                      setPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Products Content Area with 5-State lifecycle */}
            {loading ? (
              <PageSkeleton loading={true} statusText="Loading products...">
                <ProductGridSkeleton count={8} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
              </PageSkeleton>
            ) : error ? (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-red-100 max-w-lg mx-auto">
                <FiAlertCircle className="text-red-500 mx-auto text-4xl mb-3" />
                <h3 className="text-xl font-bold mb-2 text-slate-900">Unable to load products</h3>
                <p className="text-slate-500 mb-6 text-sm">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blueHover text-white text-sm font-bold rounded-full transition-colors shadow-sm"
                >
                  <FiRefreshCw size={15} /> Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-100">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">No products found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your filters or search criteria.</p>
                <button onClick={clearFilters} className="btn-premium">Clear All Filters</button>
              </div>
            ) : (
              <>
                <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map(product => (
                    <RevealItem key={product._id} className="min-w-0">
                      <ProductCard product={product} />
                    </RevealItem>
                  ))}
                </RevealStagger>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center mt-12 gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft size={20} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium transition-colors ${
                          page === i + 1 
                            ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' 
                            : 'border border-slate-200 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
