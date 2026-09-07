import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiShoppingBag, FiCreditCard, FiTruck, FiRefreshCw, FiDollarSign, FiUser, FiSliders, FiHelpCircle } from 'react-icons/fi';
import logo from '../assets/logo_dark_text.png';

const FAQPage = () => {
  const categories = [
    { id: 'ordering', label: 'Ordering', icon: <FiShoppingBag size={18} /> },
    { id: 'payments', label: 'Payments', icon: <FiCreditCard size={18} /> },
    { id: 'shipping', label: 'Shipping', icon: <FiTruck size={18} /> },
    { id: 'returns', label: 'Returns', icon: <FiRefreshCw size={18} /> },
    { id: 'refunds', label: 'Refunds', icon: <FiDollarSign size={18} /> },
    { id: 'account', label: 'Account', icon: <FiUser size={18} /> },
    { id: 'technical', label: 'Technical Support', icon: <FiSliders size={18} /> }
  ];

  const faqs = [
    // Ordering
    {
      category: 'ordering',
      question: 'How do I place an order?',
      answer: 'Browse our products, select your favorite item, specify specifications (like color or storage options), add it to your Cart, proceed to Checkout, provide your shipping details, and complete the payment.'
    },
    {
      category: 'ordering',
      question: 'Can I change my delivery address after placing an order?',
      answer: 'Yes, you can request an address modification by contacting support within 1 hour of placing the order, provided the status is still "Pending" or "Processing". Once shipped, we cannot change the address.'
    },
    {
      category: 'ordering',
      question: 'How can I view my order history?',
      answer: 'Log in to your account and navigate to the "My Orders" tab under your profile. You will see a complete list of past and pending orders.'
    },
    
    // Payments
    {
      category: 'payments',
      question: 'What payment options do you support?',
      answer: 'We support all major payment options, including Net Banking, UPI (Google Pay, PhonePe, Paytm), Credit and Debit Cards (Visa, Mastercard, RuPay), and standard digital wallets.'
    },
    {
      category: 'payments',
      question: 'Is my payment transaction secure?',
      answer: 'Absolutely. We partner with secure, PCI-DSS compliant payment gateways (Razorpay and supported payment methods). Your credentials and bank details are fully encrypted and never stored on our database.'
    },
    
    // Shipping
    {
      category: 'shipping',
      question: 'How long does shipping take?',
      answer: 'Orders within Tamil Nadu take 1-2 business days. Metros outside Tamil Nadu take 3-5 business days, and remote areas take 5-7 business days.'
    },
    {
      category: 'shipping',
      question: 'How can I track my shipment?',
      answer: 'Once shipped, you will receive a tracking link via email/SMS. You can also use our "Track Order" page to monitor the status in real-time.'
    },
    
    // Returns
    {
      category: 'returns',
      question: 'What is your return policy?',
      answer: 'We accept return or exchange requests for manufacturing defects, transit damage, or incorrect products when reported within 24 hours of delivery. The product must remain unused and include its original packaging, accessories and invoice. Eligibility is subject to inspection and our Refund & Cancellation Policy.'
    },
    
    // Refunds
    {
      category: 'refunds',
      question: 'When will I receive my refund?',
      answer: 'Once the returned item reaches our facility and passes the inspection, your refund is processed within 3-5 working days. It will reflect in your source account.'
    },
    
    // Account
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'On the Login page, click on the "Forgot Password?" link. Enter your registered email address, and we will send you a reset link instructions.'
    },
    
    // Technical Support
    {
      category: 'technical',
      question: 'What should I do if the website crashes during payment?',
      answer: 'Do not refresh the page. Check if money was deducted from your account. If deducted, please wait for an confirmation email or contact our support team with your transaction ID.'
    }
  ];

  const [activeCategory, setActiveCategory] = useState('ordering');
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = faqs.filter(faq => faq.category === activeCategory);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Frequently Asked Questions | AK Mobiles</title>
        <meta name="description" content="FAQ page for AK Mobiles. Find answers to common questions about ordering, payments, shipping, returns, refunds, and support." />
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
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Questions</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Need help? Find quick answers to the most common queries below.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-4 space-y-2 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 block mb-3">Categories</span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/15'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Accordion Questions Area */}
          <div className="lg:col-span-8 space-y-3 min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <div 
                        key={index}
                        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300"
                      >
                        <button
                          onClick={() => toggleFaq(index)}
                          className="w-full flex items-center justify-between text-left p-5 md:p-6 font-bold text-slate-800 hover:text-brand-blue transition-colors gap-4"
                        >
                          <span className="text-sm md:text-base leading-snug">{faq.question}</span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-slate-400 flex-shrink-0"
                          >
                            <FiChevronDown size={18} />
                          </motion.div>
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                              <div className="px-5 pb-5 md:px-6 md:pb-6 text-sm text-slate-650 leading-relaxed border-t border-slate-50 pt-3">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
                    <FiHelpCircle className="text-slate-350 mb-3" size={32} />
                    <p className="font-semibold text-sm">No questions in this category yet.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQPage;
