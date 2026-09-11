export const BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'POCO',
  'Vivo',
  'Oppo',
  'Realme',
  'OnePlus',
  'Motorola',
  'Google Pixel',
  'Nokia',
  'iQOO',
  'Nothing',
  'Lava',
  'Honor',
  'Asus ROG',
  'Infinix',
  'Tecno'
];

export const BRAND_COLORS = {
  'Apple': { color: '#555555', bg: '#f5f5f7', font: "'SF Pro Display', -apple-system, sans-serif", weight: '600', style: 'normal', transform: 'none' },
  'Samsung': { color: '#1428A0', bg: '#e8eaf6', font: "'Inter', sans-serif", weight: '800', style: 'normal', transform: 'uppercase' },
  'Xiaomi': { color: '#FF6900', bg: '#fff3e0', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'none' },
  'Redmi': { color: '#FF0000', bg: '#ffebee', font: "'Inter', sans-serif", weight: '800', style: 'italic', transform: 'none' },
  'POCO': { color: '#1a1a1a', bg: '#FFF9C4', font: "'Inter', sans-serif", weight: '900', style: 'normal', transform: 'uppercase' },
  'Vivo': { color: '#415FFF', bg: '#e8eaf6', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'none' },
  'Oppo': { color: '#1E8E3E', bg: '#e8f5e9', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'uppercase' },
  'Realme': { color: '#F7C948', bg: '#fffde7', font: "'Inter', sans-serif", weight: '800', style: 'normal', transform: 'none' },
  'OnePlus': { color: '#EB0028', bg: '#ffebee', font: "'Inter', sans-serif", weight: '600', style: 'normal', transform: 'none' },
  'Motorola': { color: '#5C2D91', bg: '#f3e5f5', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'none' },
  'Google Pixel': { color: '#4285F4', bg: '#e3f2fd', font: "'Inter', sans-serif", weight: '500', style: 'normal', transform: 'none' },
  'Nokia': { color: '#124191', bg: '#e3f2fd', font: "'Inter', sans-serif", weight: '800', style: 'normal', transform: 'uppercase' },
  'iQOO': { color: '#FF4500', bg: '#fbe9e7', font: "'Inter', sans-serif", weight: '900', style: 'normal', transform: 'uppercase' },
  'Nothing': { color: '#000000', bg: '#f5f5f5', font: "'Space Mono', monospace", weight: '700', style: 'normal', transform: 'none' },
  'Lava': { color: '#D32F2F', bg: '#ffebee', font: "'Inter', sans-serif", weight: '800', style: 'normal', transform: 'uppercase' },
  'Honor': { color: '#00A4EF', bg: '#e1f5fe', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'uppercase' },
  'Asus ROG': { color: '#B71C1C', bg: '#ffebee', font: "'Inter', sans-serif", weight: '900', style: 'italic', transform: 'uppercase' },
  'Infinix': { color: '#00BFA5', bg: '#e0f2f1', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'uppercase' },
  'Tecno': { color: '#1565C0', bg: '#e3f2fd', font: "'Inter', sans-serif", weight: '700', style: 'normal', transform: 'uppercase' },
};

export const CATEGORIES = [
  'Smartphones',
  'Smart Watches',
  'Earbuds',
  'Chargers',
  'Power Banks',
  'Accessories'
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

export const ORDER_STATUS = {
  PLACED: 'Placed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLORS = {
  AwaitingPayment: 'bg-amber-100 text-amber-800',
  'Awaiting Payment': 'bg-amber-100 text-amber-800',
  'Payment Pending': 'bg-amber-100 text-amber-800',
  'Payment Cancelled': 'bg-rose-100 text-rose-800',
  'Payment Failed': 'bg-rose-100 text-rose-800',
  'Payment Expired': 'bg-slate-100 text-slate-700',
  Placed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-yellow-100 text-yellow-800',
  Packed: 'bg-purple-100 text-purple-800',
  Shipped: 'bg-indigo-100 text-indigo-800',
  OutForDelivery: 'bg-cyan-100 text-cyan-800',
  'Out for Delivery': 'bg-cyan-100 text-cyan-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Returned: 'bg-orange-100 text-orange-800',
};

export const SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 49;

export const MIN_PRODUCT_IMAGES = 1;
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PRODUCT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
