import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiServer, FiFileText, FiPhone, FiMail } from 'react-icons/fi';
import logo from '../assets/logo_dark_text.png';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      icon: <FiFileText className="text-brand-blue" size={20} />,
      title: '1. Information Collected',
      content: 'We collect personal information that you provide to us when you register, place an order, subscribe to our newsletter, or contact us. This includes your name, email address, phone number, billing address, and shipping address.'
    },
    {
      icon: <FiEye className="text-purple-600" size={20} />,
      title: '2. How Customer Data is Used',
      content: 'We use your information to process transactions, deliver products, communicate order updates, send marketing promotions (with your consent), and improve our website experience and customer support.'
    },
    {
      icon: <FiLock className="text-emerald-600" size={20} />,
      title: '3. Payment Security',
      content: 'All payments are processed securely through certified payment gateways (Razorpay/PayPal/UPI). We do not store your credit/debit card numbers or UPI PINs on our servers. Your transactions are protected with industry-standard SSL encryption.'
    },
    {
      icon: <FiServer className="text-indigo-600" size={20} />,
      title: '4. Cookies & Tracking',
      content: 'We use cookies to keep track of your shopping cart contents, recognize you upon return, analyze traffic patterns, and provide personalized product recommendations. You can manage or disable cookies via your browser settings.'
    },
    {
      icon: <FiShield className="text-amber-600" size={20} />,
      title: '5. Third-Party Services',
      content: 'We share your information with trusted third parties only to the extent necessary to perform services such as shipping carriers (courier partners) and secure payment processors. We do not sell or lease customer information to advertisers.'
    },
    {
      icon: <FiFileText className="text-cyan-600" size={20} />,
      title: '6. Customer Rights',
      content: 'You have the right to access, update, correct, or request deletion of your personal data stored with us. You can perform these actions from your profile dashboard or by contacting our customer support team.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Privacy Policy | AK Mobiles</title>
        <meta name="description" content="Privacy Policy for AK Mobiles. Learn how we collect, use, and secure your personal information." />
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
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Policy</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Last Updated: July 30, 2026. Your privacy and data security are our top priorities.
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
            <h3 className="text-lg font-bold text-slate-900 mb-3">7. Contact Information</h3>
            <p className="text-slate-650 text-sm mb-6 max-w-lg mx-auto">
              If you have any questions, concerns, or requests regarding this Privacy Policy, please feel free to reach out to our grievance officer.
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

export default PrivacyPolicyPage;
