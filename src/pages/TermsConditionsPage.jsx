import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiBookOpen, FiUser, FiInfo, FiDollarSign, FiShoppingBag, FiCreditCard, FiAward, FiAlertTriangle, FiGlobe, FiMail, FiPhone } from 'react-icons/fi';
import logo from '../assets/logo_dark_text.png';

const TermsConditionsPage = () => {
  const sections = [
    {
      icon: <FiBookOpen className="text-brand-blue" size={20} />,
      title: '1. Website Usage',
      content: 'By accessing and browsing this website, you agree to comply with and be bound by these terms and conditions. The content of the pages is for your general information and use only. It is subject to change without notice.'
    },
    {
      icon: <FiUser className="text-purple-600" size={20} />,
      title: '2. User Accounts',
      content: 'When you create an account, you are responsible for maintaining the confidentiality of your account password and security. You agree to accept responsibility for all activities that occur under your user credentials.'
    },
    {
      icon: <FiInfo className="text-blue-600" size={20} />,
      title: '3. Product Information',
      content: 'We strive to display our products as accurately as possible. However, we do not warrant that product descriptions, colors, specifications, or other content on this site are completely error-free or up-to-date.'
    },
    {
      icon: <FiDollarSign className="text-emerald-600" size={20} />,
      title: '4. Pricing',
      content: 'All prices are shown in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices and discount structures at any time without prior notice.'
    },
    {
      icon: <FiShoppingBag className="text-indigo-600" size={20} />,
      title: '5. Orders',
      content: 'We reserve the right to refuse or cancel any order for reasons including but not limited to product availability, errors in product or pricing information, or suspected fraudulent activity.'
    },
    {
      icon: <FiCreditCard className="text-amber-600" size={20} />,
      title: '6. Payments',
      content: 'Payment must be made in full at the time of placing an order. We support safe payment methods including Credit/Debit Cards, Net Banking, UPI, and authorized mobile wallets.'
    },
    {
      icon: <FiAward className="text-rose-600" size={20} />,
      title: '7. Intellectual Property',
      content: 'This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, logo, graphics, and product media. Reproduction is strictly prohibited.'
    },
    {
      icon: <FiAlertTriangle className="text-orange-600" size={20} />,
      title: '8. Limitation of Liability',
      content: 'AK Mobiles shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this website or from products purchased through this platform.'
    },
    {
      icon: <FiGlobe className="text-teal-600" size={20} />,
      title: '9. Governing Law',
      content: 'These terms and conditions and your use of this website shall be governed by and construed in accordance with the laws of India. Any disputes arising out of your use shall be subject to the exclusive jurisdiction of the courts of Cuddalore district, Tamil Nadu.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Terms & Conditions | AK Mobiles</title>
        <meta name="description" content="Terms and Conditions of AK Mobiles. Understand the rules, guidelines, and agreements for using our services." />
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
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Conditions</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Last Updated: July 30, 2026. Please read these terms carefully before using our website.
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
            transition={{ duration: 0.5, delay: 0.45 }}
            className="bg-gradient-to-tr from-brand-blue/5 to-purple-600/5 rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm text-center"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-3">Questions about Terms?</h3>
            <p className="text-slate-650 text-sm mb-6 max-w-lg mx-auto">
              If you require any clarification regarding our terms of service, please contact us directly.
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

export default TermsConditionsPage;
