import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiHeart, FiSearch, FiShoppingCart } from 'react-icons/fi';
import api from '../utils/api';
import { useWishlist } from '../context/useWishlist';
import { useCart } from '../context/useCart';
import { formatPrice } from '../utils/formatPrice';
import { WishlistSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { getValidImageUrl } from '../utils/imageHelper';

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchWishlistProducts = async () => {
      if (!wishlist || wishlist.length === 0) {
        if (!ignore) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        // Extract IDs based on whether wishlist contains objects or plain strings
        const productIds = wishlist.map(item => typeof item === 'object' ? item._id : item);
        
        const promises = productIds.map(id => api.get(`/products/${id}`).catch(() => null));
        const results = await Promise.all(promises);
        
        if (!ignore) {
          const validProducts = results
            .filter(res => res && res.data)
            .map(res => res.data.product);

          setProducts(validProducts);
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Error fetching wishlist products:', error);
          setLoading(false);
        }
      }
    };

    fetchWishlistProducts();
    return () => {
      ignore = true;
    };
  }, [wishlist]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  const handleRemove = (productId) => {
    toggleWishlist(productId);
    setProducts(products.filter(p => p._id !== productId));
  };

  return (
    <>
      <Helmet>
        <title>My Wishlist | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-10 min-h-[80vh]">
        <div className="container mx-auto px-4 max-w-6xl">
          <Reveal as="h1" className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <FiHeart className="text-brand-orange" /> My Wishlist
          </Reveal>

          {loading ? (
            <PageSkeleton loading={true} statusText="Loading wishlist...">
              <WishlistSkeleton />
            </PageSkeleton>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiHeart size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Wishlist is Empty</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Found something you like? Add it to your wishlist to keep track of it for later.</p>
              <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                <FiSearch /> Browse Products
              </Link>
            </div>
          ) : (
            <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <RevealItem
                  key={product._id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col group hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="w-full aspect-square bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 flex items-center justify-center">
                    <Link to={`/products/${product._id}`} className="block w-full h-full">
                      <img src={getValidImageUrl(product.images?.[0]?.url, product.name)} alt={product.name} className="w-full h-full object-contain" />
                    </Link>
                  </div>

                  {/* Title & Brand */}
                  <Link to={`/products/${product._id}`} className="font-bold text-slate-900 hover:text-brand-orange transition-colors line-clamp-2 min-w-0">
                    {product.name}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">{product.brand}</p>

                  {/* Price & Stock */}
                  <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="font-bold text-lg text-slate-900">{formatPrice(product.offerPrice)}</span>
                    {product.originalPrice > product.offerPrice && (
                      <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  {product.stock > 0 ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded self-start mt-2">In Stock</span>
                  ) : (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded self-start mt-2">Out of Stock</span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className="btn-secondary py-2.5 px-4 min-h-[44px] flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FiShoppingCart /> Add
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="text-slate-400 hover:text-red-500 min-h-[44px] min-w-[44px] px-3 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      title="Remove from wishlist"
                    >
                      Remove
                    </button>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistPage;
