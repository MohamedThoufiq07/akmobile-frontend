import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiTruck, FiClock, FiDollarSign, FiCalendar, FiBox, FiAlertTriangle, FiShield, FiMail, FiPhone } from 'react-icons/fi';
import logo from '../assets/logo_dark_text.png';

const ShippingDeliveryPolicyPage = () => {
  const sections = [
    {
      icon: <FiBox className="text-brand-blue" size={20} />,
      title: '1. Delivery Locations',
      content: 'We deliver all across India. All cities, towns, and major rural districts are covered. We utilize pinpoint PIN code validation at the checkout page to confirm delivery viability.'
    },
    {
      icon: <FiClock className="text-purple-600" size={20} />,
      title: '2. Processing Time',
      content: 'Orders placed before 2:00 PM are processed and dispatched on the same business day. Orders placed after 2:00 PM or during official holidays are dispatched on the next working day.'
    },
    {
      icon: <FiDollarSign className="text-emerald-600" size={20} />,
      title: '3. Shipping Charges',
      content: 'We offer FREE standard delivery on orders with a merchandise subtotal of ₹999 or above. A delivery charge of ₹49 applies when the subtotal is below ₹999. Any applicable delivery charge will be clearly shown before payment.'
    },
    {
      icon: <FiCalendar className="text-indigo-600" size={20} />,
      title: '4. Estimated Delivery Time',
      content: 'Deliveries to locations within Tamil Nadu typically arrive within 1-2 business days. Deliveries to metropolitan cities outside Tamil Nadu take 3-5 business days, and other remote locations take 5-7 business days.'
    },
    {
      icon: <FiTruck className="text-amber-600" size={20} />,
      title: '5. Courier Partners',
      content: 'To ensure maximum safety and reliability, we partner with premier courier networks including Blue Dart, Delhivery, DTDC, and India Post.'
    },
    {
      icon: <FiAlertTriangle className="text-orange-600" size={20} />,
      title: '6. Delivery Delays',
      content: 'While we aim for punctual delivery, unexpected delays may happen due to extreme weather, strike situations, regional lockdowns, or peak festive rush. We will proactively notify you of any modifications.'
    },
    {
      icon: <FiShield className="text-rose-600" size={20} />,
      title: '7. Lost Shipments',
      content: 'All shipments are transit-insured. In the extremely unlikely event that a package is lost in transit, we will initiate a thorough investigation with the logistics carrier and arrange a free replacement or full refund.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Shipping & Delivery Policy | AK Mobiles</title>
        <meta name="description" content="Shipping and Delivery Policy for AK Mobiles. Learn about processing times, shipping charges, estimated delivery dates, and partners." />
      </Helmet>

      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-tr from-[#F5F3FF] via-[#F8FAFC] to-[#EFF6FF] text-slate-800 mx-4 mt-4 rounded-3xl border border-slate-200/60 shadow-[0_15px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <div className="absolute top-[-30%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-200/50 via-purple-200/40 to-transparent blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-pink-200/30 to-indigo-100/40 blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block"
          >
            <img src={logo} alt="AK Mobiles" className="h-14 mx-auto object-contain" />
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
            Shipping & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Delivery</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Last Updated: September 7, 2026. Secure transit and prompt delivery are guaranteed.
          </p>
        </div>
      </section>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                  {section.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
            </motion.div>
          ))}

          {/* Help Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-gradient-to-tr from-brand-blue/5 to-purple-600/5 rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm text-center"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-3">8. Contact Support</h3>
            <p className="text-slate-650 text-sm mb-6 max-w-lg mx-auto">
              Have questions about your active shipment or delivery schedule? Get in touch with our delivery coordinators.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm font-semibold">
              <a href="mailto:info@akmobiles.in" className="flex items-center justify-center gap-2 text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                <FiMail className="text-brand-blue" />
                info@akmobiles.in
              </a>
              <a href="tel:04143261221" className="flex items-center justify-center gap-2 text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                <FiPhone className="text-brand-blue" />
                04143 261 221
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDeliveryPolicyPage;
