import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiUsers, FiAward, FiShield, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import logoDarkText from '../assets/logo_dark_text.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
const COMMITMENTS = [
  { title: 'Genuine Products', badge: 'Authenticity Guarantee', text: 'All smartphones and accessories are 100% genuine, brand-new, and covered under official manufacturer warranties.', category: 'Product Commitment', color: '2563EB' },
  { title: 'Customer First', badge: 'Dedicated Assistance', text: 'Our support team assists you with pre-purchase guidance, order tracking, and prompt issue resolution.', category: 'Customer Assistance', color: '10B981' },
  { title: 'After-Sales Care', badge: 'Reliable Service', text: 'Every order is safely packaged and dispatched with transparent tracking and dedicated after-sales support.', category: 'Support Service', color: 'F97316' }
];

const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | AK Mobiles</title>
        <meta name="description" content="Learn about AK Mobiles, your trusted mobile phone and accessories store in Virudhachalam, Tamil Nadu." />
      </Helmet>

      {/* Light & Modern Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-tr from-blue-50/70 via-white to-purple-50/70 text-slate-800 mx-4 mt-4 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.03)] border border-slate-200/50">
        {/* Decorative Glowing Orbs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-300/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-300/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content (Left Side) */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:w-7/12 text-center lg:text-left"
            >
              {/* Logo: Full AK Mobiles logo */}
              <div className="flex items-center justify-center lg:justify-start mb-6 overflow-visible relative">
                <motion.img
                  src={logoDarkText}
                  alt="AK Mobiles"
                  className="h-24 md:h-32 lg:h-40 object-contain drop-shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              <span className="text-xs font-extrabold tracking-widest text-brand-blue uppercase bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full inline-block mb-4 shadow-sm">
                Who We Are
              </span>
              <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-black mb-6 leading-tight tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-slate-850 to-brand-blue bg-clip-text text-transparent">
                Connecting You to <br/>
                <span className="bg-gradient-to-r from-brand-blue to-purple-600 bg-clip-text text-transparent">World Class Tech</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-550 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                AK Mobiles is the region's premium destination for smartphones, smartwatches, and accessories. Based in Virudhachalam, we bridge the gap between global innovations and local consumers, providing official brands, competitive rates, and reliable after-sales support.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link to="/products" className="btn-premium px-8 py-3.5 shadow-md shadow-brand-blue/20">
                  Explore Products
                </Link>
                <Link to="/contact" className="btn-premium-outline bg-white/80 px-8 py-3.5 shadow-sm">
                  Contact Support
                </Link>
              </div>
            </motion.div>

            {/* Floating Mobile Phone Card (Right Side) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="lg:w-5/12 flex justify-center relative"
            >
              {/* Soft glow behind phone */}
              <div className="absolute w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-brand-blue/15 to-transparent blur-[50px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 animate-pulse"></div>

              {/* Floating Phone Showcase Card */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 flex justify-center items-center bg-white rounded-3xl shadow-xl p-10 md:p-14"
              >
                <img
                  src="https://img-prd-pim.poorvika.com/cdn-cgi/image/width=500,height=500,quality=75/product/Apple-iphone-15-pro-natural-titanium-512gb-Front-Back-View.png"
                  alt="AK Mobiles Premium Phone Display"
                  className="max-h-[220px] md:max-h-[280px] object-contain"
                />

                {/* 5G Ready badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-8 top-1/3 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center font-bold text-xs">5G</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none mb-1">5G Ready</p>
                    <p className="text-xs text-slate-400 leading-none">Lightning fast</p>
                  </div>
                </motion.div>

                {/* Warranty badge */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -right-8 bottom-1/4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FiShield size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none mb-1">1 Yr Warranty</p>
                    <p className="text-xs text-slate-400 leading-none">Brand protection</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Customer Satisfaction Section */}
      <section className="pt-16 pb-24 mt-8 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Visual Frame */}
            <Reveal className="lg:w-1/2 relative w-full flex justify-center">
              <div className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-brand-blue/15 to-purple-600/10 blur-[70px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>

              <div className="relative z-10 w-full rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-slate-100 shadow-xl flex justify-center items-center min-h-[540px] p-6">
                <img
                  src="/product-bundle.png"
                  alt="AK Mobiles Product Bundle"
                  className="w-full h-full max-h-[640px] object-contain scale-110"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </Reveal>

            {/* Content block */}
            <Reveal delay={0.1} className="lg:w-1/2">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-purple-600 uppercase bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full mb-4">
                <FiUsers size={14} /> AK Mobiles
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
                Customer Satisfaction
              </h2>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight bg-gradient-to-r from-brand-blue via-purple-600 to-orange-500 bg-clip-text text-transparent">
                is Our Priority
              </h2>
              <p className="text-slate-600 leading-relaxed text-base md:text-lg mb-8">
                At AK Mobiles, we don't just sell products – we build relationships. Every decision we make is centered around delivering the best experience to our customers.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  { icon: FiShield, title: '100% Authentic Products', desc: 'We guarantee original products from top brands with official warranty.' },
                  { icon: FiUsers, title: 'Dedicated Customer Support', desc: 'Our support team is always ready to assist you before and after your purchase.' },
                  { icon: FiCheckCircle, title: '24-Hour Issue Reporting', desc: 'Report manufacturing defects, transit damage, or incorrect products within 24 hours of delivery. Eligibility is subject to inspection and our Refund & Cancellation Policy.' },
                  { icon: FiAward, title: 'Fast & Secure Delivery', desc: 'Quick delivery across India with safe and secure packaging.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-5 border-b border-slate-200/60 last:border-0 last:pb-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-purple-600">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base mb-0.5">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: FiShield, title: '1 Year', sub: 'Warranty' },
                  { icon: FiAward, title: 'Original', sub: 'Products' },
                  { icon: FiCheckCircle, title: '24 Hours', sub: 'Issue Reporting' },
                  { icon: FiUsers, title: 'Pan India', sub: 'Fast Delivery' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <item.icon size={18} className="text-purple-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-xs text-slate-400 leading-tight">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Modern Stats Section */}
      <section className="py-16 bg-slate-950 text-white relative overflow-hidden mx-4 rounded-3xl border border-slate-900 shadow-md">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-tr from-brand-blue/10 to-transparent rounded-full blur-[80px]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <RevealStagger className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <RevealItem className="text-center">
              <div className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Genuine</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Product Commitment</div>
            </RevealItem>
            <RevealItem className="text-center">
              <div className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Customer First</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Service Approach</div>
            </RevealItem>
            <RevealItem className="text-center">
              <div className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Local Support</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Customer Assistance</div>
            </RevealItem>
            <RevealItem className="text-center">
              <div className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">After-Sales</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Support Service</div>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* Why Choose Us Cards */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[clamp(1.875rem,4vw,2.25rem)] font-extrabold text-slate-900 mb-4">Why Shop With Us?</h2>
            <p className="text-slate-500 text-lg">We stand by quality, affordability, and regional reliability.</p>
          </Reveal>

          <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <RevealItem
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiCheckCircle size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">100% Genuine</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                All inventory is sourced directly from certified brand distributors. Complete box seals, GST bills, and official warranties.
              </p>
            </RevealItem>

            <RevealItem
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiAward size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Best Prices</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Competitive pricing structures, trade-in exchange bonuses, and special credit card/no-cost EMI structures.
              </p>
            </RevealItem>

            <RevealItem
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiUsers size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Expert Advice</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our in-store technical team works to help you compare specs and select the ideal device. No pushy sales.
              </p>
            </RevealItem>

            <RevealItem
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FiShield size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">After-Sales Care</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Free setup, phone-to-phone data restoration, and seamless coordination with service outlets for warranty issues.
              </p>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* Service Commitments Section */}
      <section className="py-24 bg-gradient-to-tr from-blue-50/50 via-purple-50/50 to-pink-50/50 relative overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[clamp(1.875rem,4vw,2.5rem)] font-black text-slate-900 mb-4">
              Our Service Commitments
            </h2>
            <p className="text-slate-500 text-lg">
              Dedicated to quality service and customer satisfaction across Tamil Nadu
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
              }}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              pagination={{ clickable: true }}
              className="reviews-swiper pb-14"
            >
              {COMMITMENTS.map((item, idx) => {
                const initials = getInitials(item.title);
                return (
                  <SwiperSlide key={idx} className="h-auto py-2">
                    <motion.div
                      whileHover={{
                        y: -8,
                        boxShadow: `0 20px 25px -5px #${item.color}20, 0 8px 10px -6px #${item.color}20`,
                        borderColor: `#${item.color}50`
                      }}
                      className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-full transition-colors duration-300 cursor-grab active:cursor-grabbing"
                    >
                      <div>
                        {/* Commitment Rating / Quality Icon */}
                        <div className="flex gap-1 mb-5">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className="fill-yellow-400 text-yellow-400" size={18} />
                          ))}
                        </div>
                        {/* Text */}
                        <p className="text-slate-600 font-medium italic text-base leading-relaxed mb-6">
                          "{item.text}"
                        </p>
                      </div>
                      
                      {/* Divider */}
                      <div className="pt-5 border-t border-slate-100 mt-auto flex items-center gap-4">
                        {/* Initial Circle with Dynamic Background Color */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-base tracking-wider shrink-0"
                          style={{ backgroundColor: `#${item.color}` }}
                        >
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">{item.title}</h4>
                          <p className="text-xs text-slate-400 font-medium">{item.badge} • {item.category}</p>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
