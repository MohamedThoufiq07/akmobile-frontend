import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiXCircle, FiCheckSquare, FiAlertCircle, FiTrendingUp, FiClock, FiMail, FiPhone } from 'react-icons/fi';
import logo from '../assets/logo_dark_text.png';

const RefundCancellationPolicyPage = () => {
  const sections = [
    {
      icon: <FiXCircle className="text-rose-600" size={20} />,
      title: '1. Order Cancellation Rules',
      content: 'You can request to cancel your order within 2 hours of placement or before the status transitions to "Shipped," whichever is earlier. Once the product has been dispatched, we cannot accept cancellation requests.'
    },
    {
      icon: <FiCheckSquare className="text-emerald-600" size={20} />,
      title: '2. Refund Eligibility',
      content: 'Refunds are eligible only for items that are cancelled within the valid timeframe, or returned due to manufacturing defects, damaged shipments, or incorrect item delivery. Returned products must be in their original packaging, unused, and include all accessories.'
    },
    {
      icon: <FiAlertCircle className="text-amber-600" size={20} />,
      title: '3. Damaged Products',
      content: 'In the rare case that your product arrives damaged during shipping, please record an unboxing video and report the damage to us within 24 hours of delivery. A replacement or full refund will be processed upon inspection.'
    },
    {
      icon: <FiAlertCircle className="text-purple-600" size={20} />,
      title: '4. Wrong Product Received',
      content: 'If you receive a mobile model or color variant different from what you ordered, please contact us immediately without breaking the original seals. We will arrange a free exchange or refund.'
    },
    {
      icon: <FiTrendingUp className="text-brand-blue" size={20} />,
      title: '5. Refund Process',
      content: 'Once your return request is approved and the product is inspected at our warehouse, your refund will be processed. The refund will be credited back to your original payment method (bank account, card, or UPI).'
    },
    {
      icon: <FiClock className="text-indigo-600" size={20} />,
      title: '6. Refund Timeline',
      content: 'Refunds are typically processed within 3-5 business days from the date of return approval. The actual time for the refund to reflect in your account depends on your financial institution.'
    },
    {
      icon: <FiXCircle className="text-slate-600" size={20} />,
      title: '7. Non-Refundable Items',
      content: 'Opened software, free gift products, promotional items, custom mobile covers/screen guards, and products with physical damage caused by customer misuse are strictly non-refundable.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Refund & Cancellation Policy | AK Mobiles</title>
        <meta name="description" content="Refund and Cancellation Policy for AK Mobiles. Learn about order cancellations, refund eligibility, process, and timelines." />
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
            Refund & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Cancellation</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Last Updated: July 30, 2026. Please read our guidelines on cancellations and returns.
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

          {/* Contact Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-gradient-to-tr from-brand-blue/5 to-purple-600/5 rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm text-center"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-3">Initiate a Return/Cancellation</h3>
            <p className="text-slate-650 text-sm mb-6 max-w-lg mx-auto">
              Need assistance with canceling an order or checking your refund status? Contact our support agents right away.
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

export default RefundCancellationPolicyPage;
