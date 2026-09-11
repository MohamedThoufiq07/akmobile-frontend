import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {
  FiHeart, FiShoppingCart,
  FiZap, FiStar,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/useCart';
import { useWishlist } from '../context/useWishlist';
import bannerSmartphones from '../assets/banners/banner-smartphones.png';
import bannerLaptops from '../assets/banners/banner-laptops.png';
import bannerAccessories from '../assets/banners/banner-accessories.png';
import bannerAirpods from '../assets/banners/banner-airpods.png';
import { getValidImageUrl } from '../utils/imageHelper';
import ProductCardSkeleton from '../components/ui/skeleton/ProductCardSkeleton';

// --- DEMO DATA ---
const DEMO_PRODUCTS = [
  {
    id: 1, name: "iPhone 15 Pro Max", brand: "Apple",
    price: 16, offer: 14, discount: 13,
    rating: 4.8, reviews: 2341, tag: "HOT",
    image: "https://img-prd-pim.poorvika.com/cdn-cgi/image/width=500,height=500,quality=75/product/Apple-iphone-15-pro-natural-titanium-512gb-Front-Back-View.png"
  },
  {
    id: 2, name: "Samsung Galaxy S24 Ultra", brand: "Samsung",
    price: 13, offer: 12, discount: 8,
    rating: 4.9, reviews: 1820, tag: "NEW",
    image: "https://static0.xdaimages.com/wordpress/wp-content/uploads/2024/01/galaxy-s24-ultra-1.png?q=50&fit=contain&w=420&dpr=1.5"
  },
  {
    id: 3, name: "OnePlus 12", brand: "OnePlus",
    price: 69, offer: 64, discount: 7,
    rating: 4.6, reviews: 1240, tag: "HOT",
    image: "https://image01-in.oneplus.net/media/202407/04/9052428d8c69bd8bb884c7913af5fa73.png"
  },
  {
    id: 4, name: "Redmi Note 13 Pro+ 5G", brand: "Xiaomi",
    price: 32, offer: 28, discount: 13,
    rating: 4.5, reviews: 3100, tag: "SALE",
    image: "https://i03.appmifile.com/789_item_in/04/07/2024/291d6375bb3ce600675227b27a29ac3c.png"
  },
  {
    id: 5, name: "Vivo V30 Pro", brand: "Vivo",
    price: 39, offer: 34, discount: 13,
    rating: 4.4, reviews: 980, tag: "NEW",
    image: "https://in-exstatic-vivofs.vivo.com/gdHFRinHEMrj3yPG/1709633883246/7e1e7e35082e2abf290ec7c423d4361f.png"
  },
  {
    id: 6, name: "Realme 12 Pro+ 5G", brand: "Realme",
    price: 28, offer: 25, discount: 11,
    rating: 4.3, reviews: 760, tag: "SALE",
    image: "https://img-prd-pim.poorvika.com/cdn-cgi/image/width=500,height=500,quality=75/product/realme-12-pro-5g-Navigator-beige-256gb-8gb-ram-front-back-view.png"
  },
];

// E-Commerce Premium Hero Banner Sliders Array (pre-designed full banner images)
const HERO_MARKETING_SLIDES = [
  { image: bannerSmartphones, link: "/products?category=Smartphones", alt: "Up to 50% Off on Premium Smartphones" },
  { image: bannerLaptops, link: "/products", alt: "Up to 45% Off on Premium Laptops" },
  { image: bannerAccessories, link: "/products?category=Accessories", alt: "Up to 60% Off on Premium Accessories" },
  { image: bannerAirpods, link: "/products?category=Earbuds", alt: "Up to 20% Off on AirPods & Earbuds" }
];

// --- BRAND DATA LIST WITH ICONS & UNIQUE BRAND STYLES ---
const BRAND_DATA = [
  { name: 'Apple', logo: '', color: '#000000', bg: '#f5f5f7', weight: '600', style: 'normal', transform: 'none' },
  { name: 'Samsung', logo: '', color: '#1428A0', bg: '#e8eaf6', weight: '800', style: 'normal', transform: 'uppercase' },
  { name: 'Xiaomi', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://mi.com&size=256', color: '#FF6900', bg: '#fff3e0', weight: '700', style: 'normal', transform: 'none' },
  { name: 'POCO', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://poco.in&size=256', color: '#1a1a1a', bg: '#FFF9C4', weight: '900', style: 'normal', transform: 'uppercase' },
  { name: 'Vivo', logo: '', color: '#415FFF', bg: '#e8eaf6', weight: '700', style: 'normal', transform: 'none' },
  { name: 'Oppo', logo: '', color: '#1E8E3E', bg: '#e8f5e9', weight: '700', style: 'normal', transform: 'uppercase' },
  { name: 'Realme', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://realme.com&size=256', color: '#F7C948', bg: '#fffde7', weight: '800', style: 'normal', transform: 'none' },
  { name: 'OnePlus', logo: '', color: '#EB0028', bg: '#ffebee', weight: '600', style: 'normal', transform: 'none' },
  { name: 'Motorola', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://motorola.com&size=256', color: '#5C2D91', bg: '#f3e5f5', weight: '700', style: 'normal', transform: 'none' },
  { name: 'Google Pixel', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://google.com&size=256', color: '#4285F4', bg: '#e3f2fd', weight: '500', style: 'normal', transform: 'none' },
  { name: 'Nokia', logo: '', color: '#124191', bg: '#e3f2fd', weight: '800', style: 'normal', transform: 'uppercase' },
  { name: 'iQOO', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://iqoo.com&size=256', color: '#FF4500', bg: '#fbe9e7', weight: '900', style: 'normal', transform: 'uppercase' },
  { name: 'Nothing', logo: '', color: '#000000', bg: '#f5f5f5', weight: '700', style: 'normal', transform: 'none' },
  { name: 'Honor', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://hihonor.com&size=256', color: '#00A4EF', bg: '#e1f5fe', weight: '700', style: 'normal', transform: 'uppercase' },
  { name: 'Infinix', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://infinixmobility.com&size=256', color: '#00BFA5', bg: '#e0f2f1', weight: '700', style: 'normal', transform: 'uppercase' }
];

const BrandLogo = ({ brand, size = 'md' }) => {
  const sizeMap = { sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' };
  const fontSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontFamily: brand.name === 'Nothing' ? "'Space Mono', monospace" : "'Inter', sans-serif",
        fontSize,
        fontWeight: brand.weight,
        fontStyle: brand.style,
        textTransform: brand.transform,
        color: brand.color,
        letterSpacing: brand.name === 'Samsung' || brand.name === 'Nokia' ? '0.15em' : '0.02em',
        lineHeight: 1,
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {brand.name === 'Apple' && (
        <svg viewBox="0 0 170 170" style={{ height: `calc(${fontSize} * 1.2)`, width: 'auto', fill: brand.color }} className="mr-1 inline-block">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.37.13-9.13-1.9-14.28-6.07-3.43-2.77-7.22-7.39-11.4-13.84-8.8-13.56-15.54-28.52-20.2-44.91-4.66-16.39-6.99-31.13-6.99-44.22 0-14.92 3.86-26.68 11.59-35.32 7.72-8.64 17.15-13.06 28.27-13.27 5.03 0 10.63 1.5 16.79 4.5 6.17 3 10.37 4.5 12.61 4.5 2.11 0 6.26-1.5 12.45-4.5 6.19-3 11.91-4.43 17.16-4.3 11.87.26 21.6 4.38 29.21 12.35 6.46 6.81 11.02 15.02 13.68 24.63-14.39 5.92-21.36 15.69-20.9 29.3 0.46 10.3 4.29 18.89 11.49 25.77 7.21 6.88 15.86 10.51 25.96 10.87-2.64 8.44-6.04 16.48-10.2 24.12zM119.22 28.74c0-7.85 2.81-15.07 8.42-21.65 5.61-6.58 12.32-10.26 20.14-11.05.13 1 .2 1.91.2 2.76 0 7.49-2.88 14.54-8.63 21.16-5.76 6.63-12.77 10.37-21.05 11.23-.26-1.12-.39-2.12-.39-3.05z" />
        </svg>
      )}
      {brand.name === 'OnePlus' ? (
        <span style={{ backgroundColor: '#EB0028', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: `calc(${fontSize} * 0.9)`, display: 'inline-flex', alignItems: 'center', justify_content: 'center' }}>1+</span>
      ) : brand.name === 'POCO' ? (
        <span style={{ color: '#FFD600', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>POCO</span>
      ) : (
        brand.name
      )}
    </div>
  );
};

// Marketing offer cards for the "Hot Category Deals" section
const CATEGORY_DEALS = [
  { name: 'Smartphones', offer: 'Up to 40% Off', image: 'https://static0.xdaimages.com/wordpress/wp-content/uploads/2024/01/galaxy-s24-ultra-1.png?q=50&fit=contain&w=420&dpr=1.5', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Smart Watches', offer: 'Up to 60% Off', image: 'https://png.pngtree.com/png-vector/20241025/ourmid/pngtree-smart-watch-png-image_14171827.png', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Earbuds', offer: 'Up to 55% Off', image: 'https://static.vecteezy.com/system/resources/thumbnails/050/361/399/small/pair-of-wireless-earbuds-in-compact-charging-case-on-transparent-background-png.png', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Power Banks', offer: 'Up to 45% Off', image: '/images/categories/powerbank.png', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Chargers', offer: 'Up to 35% Off', image: 'https://png.pngtree.com/png-vector/20250619/ourmid/pngtree-a-3d-charger-with-cable-icon0n-realistic-png-image_16551830.png', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Accessories', offer: 'Up to 50% Off', image: 'https://png.pngtree.com/png-vector/20250125/ourmid/pngtree-universal-portable-three-sided-pyramid-mobile-accessory-png-image_15329597.png', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Laptops', offer: 'Up to 40% Off', image: 'https://freepngimg.com/save/162035-laptop-notebook-png-file-hd/800x620', bg: '#EEF8F0', accent: '#16A34A' },
  { name: 'Tablets', offer: 'Up to 35% Off', image: 'https://www.pngarts.com/files/1/Apple-Tablet-Transparent-Image.png', bg: '#EEF8F0', accent: '#16A34A' }
];

const ProductCardUI = ({ product, disableHover = false }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const productId = product._id || product.id;
  const detailUrl = typeof productId === 'string' && productId.length > 10 ? `/products/${productId}` : `/products`;
  const isWishlisted = typeof productId === 'string' ? isInWishlist(productId) : false;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <motion.div
      whileHover={disableHover ? {} : { y: -8, transition: { duration: 0.2 } }}
      className={`bg-white rounded-2xl border border-slate-200/60 p-4 relative group h-full flex flex-col transition-shadow hover:shadow-xl`}
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <span className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider uppercase">
          {product.discount}% OFF
        </span>
        {product.tag && (
          <span className={`text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wider uppercase ${
            product.tag === 'NEW' ? 'bg-purple-600' : product.tag === 'HOT' ? 'bg-fuchsia-600' : 'bg-violet-600'
          }`}>
            {product.tag}
          </span>
        )}
      </div>

      <button
        className="absolute top-4 right-4 z-10 p-2.5 bg-white/95 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-slate-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof productId === 'string') {
            toggleWishlist(productId);
          } else {
            toast.success("Added to wishlist");
          }
        }}
      >
        <FiHeart className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
      </button>

      <Link to={detailUrl} className="block relative h-48 sm:h-52 mb-4 mt-2 overflow-hidden flex items-center justify-center p-4">
        <img
          src={getValidImageUrl(product.image, product.name)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      <div className="flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-1 text-yellow-500 text-xs font-medium">
          <FiStar className="fill-yellow-500" size={12} />
          <span>{product.rating}</span>
          <span className="text-slate-400 ml-1">({product.reviews})</span>
        </div>

        <Link to={detailUrl}>
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-1 line-clamp-2 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 mb-2 font-bold">{product.brand}</p>
        </Link>

        <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{product.offer.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between items-center mb-3 text-[10px] font-bold">
            <span className="text-green-600">Save ₹{(product.price - product.offer).toLocaleString('en-IN')}</span>
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">EMI from ₹{Math.round(product.offer / 12).toLocaleString('en-IN')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleAddToCart}
              className="text-xs font-bold border border-brand-blue text-brand-blue bg-white hover:bg-brand-blue hover:text-white rounded-full py-2 transition-colors flex justify-center items-center gap-1.5"
            >
              <FiShoppingCart size={12} /> Add
            </button>
            <button
              onClick={handleBuyNow}
              className="text-xs font-bold bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blueHover hover:to-purple-700 text-white rounded-full py-2 hover:shadow-md transition-all flex justify-center items-center"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const toCard = (p) => ({
  _id: p._id,
  id: p._id,
  name: p.name,
  brand: p.brand,
  price: Number(p.originalPrice ?? p.original_price ?? p.price ?? 0),
  offer: Number(p.offerPrice ?? p.offer_price ?? p.offer ?? 0),
  offerPrice: Number(p.offerPrice ?? p.offer_price ?? p.offer ?? 0),
  originalPrice: Number(p.originalPrice ?? p.original_price ?? p.price ?? 0),
  discount: p.discount ?? (p.originalPrice && p.offerPrice ? Math.round(((p.originalPrice - p.offerPrice) / p.originalPrice) * 100) : 0),
  rating: p.rating || 4.5,
  reviews: p.numReviews || p.reviews || 0,
  stock: p.stock !== undefined ? p.stock : 20,
  image: p.images?.[0]?.url || p.image || `https://placehold.co/600x600/f1f5f9/64748b?text=${encodeURIComponent(p.brand || 'Product')}`,
  images: p.images,
  tag: p.isFeatured ? 'HOT' : (p.flashSale ? 'SALE' : null),
});

const HomePage = () => {
  const [realProducts, setRealProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [customBanners, setCustomBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let ignore = false;
    const fetchHomeData = async () => {
      try {
        const [prodRes, setRes] = await Promise.all([
          api.get('/products?limit=52').catch(() => ({ data: { products: [] } })),
          api.get('/settings').catch(() => ({ data: { settings: null } }))
        ]);
        
        if (!ignore) {
          const allProds = Array.isArray(prodRes.data?.products) ? prodRes.data.products : [];
          // Shuffle products randomly on every page load/refresh
          const shuffled = [...allProds].sort(() => Math.random() - 0.5);
          setRealProducts(shuffled);

          const flashSales = shuffled.filter(p => p.flashSale === true);
          setFlashSaleProducts(flashSales.length > 0 ? flashSales.slice(0, 6) : shuffled.slice(0, 6));

          const settingsData = setRes.data?.settings;
          if (settingsData?.banners && Array.isArray(settingsData.banners)) {
            const activeBanners = settingsData.banners.filter(b => b.active !== false);
            if (activeBanners.length > 0) {
              setCustomBanners(activeBanners);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error loading home data:', err);
          setLoading(false);
        }
      }
    };
    fetchHomeData();
    return () => {
      ignore = true;
    };
  }, []);

  const heroSlides = customBanners.length > 0 ? customBanners : HERO_MARKETING_SLIDES;

  const flashActive = Boolean(flashSaleProducts.length > 0);
  const flashCards = flashActive ? flashSaleProducts.map(toCard) : null;

  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 44, seconds: 12 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (num) => String(num).padStart(2, '0');

  const allCardProducts = realProducts.length > 0
    ? realProducts.map(toCard)
    : DEMO_PRODUCTS;

  const filteredProducts = filter === 'All'
    ? allCardProducts.slice(0, 12)
    : allCardProducts.filter(p => p.brand?.toLowerCase() === filter.toLowerCase()).slice(0, 12);

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>AK Mobiles | Premium Mobile Store in Virudhachalam</title>
      </Helmet>

      {/* HERO SECTION: Premium E-Commerce Full-Width Banner Carousel */}
      <section className="w-full bg-slate-50 pt-2 px-2 sm:px-10 pb-0">
        <div className="relative max-w-7xl mx-auto">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true, el: '.hero-swiper-pagination' }}
            navigation={{
              prevEl: '.hero-swiper-prev',
              nextEl: '.hero-swiper-next',
            }}
            className="w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-sm"
          >
            {heroSlides.map((slide, idx) => (
              <SwiperSlide key={slide.id || slide._id || idx}>
                <Link to={slide.link || '/products'} className="block relative w-full h-full overflow-hidden bg-white">
                  <img
                    src={slide.image}
                    alt={slide.alt || slide.title || 'Banner'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Left & Right Arrows */}
          <button className="hero-swiper-prev absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all focus:outline-none">
            <FiChevronLeft className="size-6 sm:size-7" />
          </button>
          <button className="hero-swiper-next absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all focus:outline-none">
            <FiChevronRight className="size-6 sm:size-7" />
          </button>

          {/* Custom bottom-center pagination */}
          <div className="hero-swiper-pagination absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-5 z-10 flex items-center gap-1.5 w-auto"></div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">

        {/* HOT CATEGORY DEALS - dome/arch card row */}
        <section className="flex flex-col gap-4">
          {/* Section header: title left, view-all right */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">Hot Deals by Category</h2>
            <Link to="/products" className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-blueHover">
              VIEW ALL <FiChevronRight />
            </Link>
          </div>

          {/* Card row: single line, horizontal swipe/mouse-scroll at all breakpoints */}
          <div className="flex gap-6 overflow-x-auto -mx-4 px-4 py-2 no-scrollbar">
            {CATEGORY_DEALS.map((deal, idx) => (
              <Link
                key={idx}
                to={`/products?category=${encodeURIComponent(deal.name)}`}
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                {/* Dome/arch background: 140x140 square, top corners = half of width/height */}
                <div
                  className="relative flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-[70px_70px_12px_12px]"
                  style={{ backgroundColor: deal.bg }}
                >
                  <img
                    src={deal.image}
                    alt={deal.name}
                    loading="lazy"
                    className="relative z-10 h-[62%] w-[62%] object-contain drop-shadow-[0_14px_16px_rgba(15,23,42,0.16)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
                  />
                </div>

                {/* Label */}
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-xs font-bold leading-tight text-slate-900 sm:text-sm">{deal.name}</span>
                  <span className="text-[10px] font-semibold sm:text-xs" style={{ color: deal.accent }}>
                    {deal.offer}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FLASH SALE TIMER SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-brand-blue to-purple-600 text-white">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <FiZap className="text-yellow-300 animate-pulse text-2xl" />
              <span className="text-base sm:text-lg font-black tracking-wide">🔥 DEALS OF THE DAY</span>
            </div>

            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-blue-100">Ending In:</span>
              <div className="flex gap-1 font-mono text-sm font-black text-brand-blue">
                <span className="bg-white px-2 py-0.5 rounded shadow">{pad(timeLeft.hours)}</span>
                <span className="text-white animate-pulse">:</span>
                <span className="bg-white px-2 py-0.5 rounded shadow">{pad(timeLeft.minutes)}</span>
                <span className="text-white animate-pulse">:</span>
                <span className="bg-white px-2 py-0.5 rounded shadow">{pad(timeLeft.seconds)}</span>
              </div>
            </div>
          </div>

          <div className="p-4" aria-busy={loading}>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" aria-hidden="true">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {((flashCards && flashCards.length > 0) ? flashCards : allCardProducts).slice(0, 6).map((product) => (
                  <ProductCardUI key={product.id || product._id} product={{ ...product, tag: 'DEAL' }} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

        {/* INTERACTIVE MOVING BRAND SECTION (full viewport width breakout, before Reviews section container) */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-12 bg-transparent space-y-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-black text-slate-800">Shop by Brand</h2>
        </div>
        <div className="w-full overflow-hidden">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={28}
            slidesPerView="auto"
            loop={true}
            speed={3500}
            allowTouchMove={true}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            onSwiper={(swiper) => {
              const el = swiper.el;
              if (el) {
                el.addEventListener('mouseleave', () => {
                  swiper.autoplay.start();
                });
              }
            }}
            className="swiper-continuous-ticker flex items-center animate-marquee-container"
          >
            {BRAND_DATA.map((brand, idx) => (
              <SwiperSlide key={idx} style={{ width: 'auto' }} className="py-2">
                <Link
                  to={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="w-[230px] h-[90px] bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl flex items-center justify-center"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = brand.color + '60';
                    e.currentTarget.style.boxShadow = `0 10px 25px ${brand.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="flex items-center gap-4">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 object-contain shrink-0 pointer-events-none"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : brand.name === 'Google Pixel' || brand.name === 'Motorola' || brand.name === 'Honor' || brand.name === 'Infinix' || brand.name === 'iQOO' ? (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0" style={{ color: brand.color }}>
                        {brand.name[0]}
                      </div>
                    ) : null}
                    <BrandLogo brand={brand} size="lg" />
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* TRENDING DEALS GRID */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Trending Products &amp; Hot Deals</h3>
            <div className="flex flex-wrap gap-2">
              {['All', 'Apple', 'Samsung', 'OnePlus'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1 text-xs font-bold rounded-full border ${filter === f ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div aria-busy={loading}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-hidden="true">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCardUI key={product.id || product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      

    </div>
  );
};

export default HomePage;