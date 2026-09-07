import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  FiMapPin, FiPhone, FiMail, FiClock, FiSend, 
  FiCheckCircle, FiMessageSquare, FiNavigation, FiShield, FiHeadphones, FiUsers 
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import logo from '../assets/logo_dark_text.png';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/contact', formData);
      toast.success(data.message || "Message sent successfully!");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Contact Us | AK Mobiles</title>
        <meta name="description" content="Contact AK Mobiles in Virudhachalam. Visit our store, call us, or send a message." />
      </Helmet>

      {/* FINALIZED ATTRACTIVE BANNER HEADER SECTION */}
      <section className="relative bg-gradient-to-tr from-[#F5F3FF] via-[#F8FAFC] to-[#EFF6FF] text-slate-800 mx-4 mt-4 rounded-3xl border border-slate-200/60 shadow-[0_15px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Soft Radial Light Blurs */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <div className="absolute top-[-30%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-200/50 via-purple-200/40 to-transparent blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-pink-200/30 to-indigo-100/40 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-w-0">
            
            {/* Left Content Column (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-5 text-left min-w-0">
              
              {/* Brand Logo Symbol in Left Corner */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-1"
              >
                <img src={logo} alt="AK Mobiles" className="h-14 object-contain" />
              </motion.div>

              {/* Main Heading Text */}
              <h1 className="text-[clamp(2.5rem,6vw,4.25rem)] font-black text-slate-900 leading-[1.1] tracking-tight">
                We're Here <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                  to Help!
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-bold max-w-xl">
                Your satisfaction is our priority. Our support team is always ready to assist you.
              </p>

              {/* 4 Feature Quick Response Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 w-full max-w-2xl">
                <div className="flex flex-col items-center p-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/50 shadow-sm text-center">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-md mb-2 shadow-inner"><FiMessageSquare /></div>
                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wide">Quick Response</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">We reply within minutes</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/50 shadow-sm text-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-md mb-2 shadow-inner"><FiHeadphones /></div>
                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wide">Expert Support</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">Trained professionals to help you</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/50 shadow-sm text-center">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-md mb-2 shadow-inner"><FiShield /></div>
                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wide">Trusted Service</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">100% genuine and reliable</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-200/50 shadow-sm text-center">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-md mb-2 shadow-inner"><FiUsers /></div>
                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wide">Customer First</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">Your satisfaction is our success</span>
                </div>
              </div>

              {/* Bottom Badge Link Button */}
              <div className="pt-3 w-full sm:w-auto">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm">
                  <FiPhone className="text-purple-600 animate-pulse text-sm" /> 
                  <div>
                    <span className="text-purple-600 font-black uppercase tracking-wider mr-1">Get In Touch</span> 
                    <span className="text-slate-400 font-medium">We're just a message away!</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Graphic Column (5 COLS - Support Agent Photo) */}
            <div className="lg:col-span-5 relative flex justify-center items-center min-w-0 w-full h-[260px] sm:h-[340px] md:h-[400px] lg:h-[460px]">

              <div className="absolute bottom-2 w-72 h-8 bg-slate-300/30 blur-xl rounded-full z-0"></div>

              {/* Support Agent Photo */}
              <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white">
                <img
                  src="/support-agent.png"
                  alt="AK Mobiles Support Team"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* DUAL COLUMNS TEXT FORM GRID CONTROLS */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* COLUMN 1: Vibrant Light Theme Contact Card */}
          <Reveal className="lg:w-1/3 flex">
            <div className="bg-gradient-to-br from-purple-50 via-blue-50/60 to-indigo-50 text-slate-800 rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between w-full border border-purple-100/70">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-10 left-0 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl pointer-events-none"></div>
              
              <div>
                <h2 className="text-xl font-black tracking-tight mb-8 border-b border-purple-100 pb-3 uppercase text-slate-800">Contact Information</h2>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                      <FiMapPin size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Store Address</h3>
                      <p className="text-slate-700 text-sm leading-relaxed font-bold">
                        No 113 B, Near Agarwal Eye Hospital, <br />
                        Opposite Bus Stand, Junction Road, <br />
                        Shakti Nagar, Vriddhachalam – 606001, Tamil Nadu.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                      <FiPhone size={18} />
                    </div>
                    <div className="w-full">
                      <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Phone &amp; Hotline</h3>
                      <a href="tel:04143261221" className="text-blue-600 font-black hover:underline block text-sm mb-2">04143 261 221 (Landline)</a>
                      <a href="https://wa.me/917947107854" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-black shadow-md transition-all duration-300">
                        <FaWhatsapp size={14} /> WhatsApp Support
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                      <FiMail size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Email Helpdesk</h3>
                      <a href="mailto:info@akmobiles.in" className="text-blue-600 font-black hover:underline transition-colors text-sm break-all">info@akmobiles.in</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex items-center justify-center text-pink-600 shrink-0">
                      <FiClock size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Store Hours</h3>
                      <p className="text-slate-700 text-sm font-bold">Monday - Sunday: Until 10:00 PM</p>
                      <p className="text-emerald-400 text-[10px] font-black mt-1 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded inline-block border border-emerald-200">Open all days</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-purple-100 pt-4 text-center text-[11px] text-slate-400 font-bold tracking-wider uppercase">
                AK MOBILES — Trusted Mobile Retailer
              </div>
            </div>
          </Reveal>

          {/* COLUMN 2: Message Form Container */}
          <Reveal delay={0.1} className="lg:w-2/3 flex">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/30 border border-slate-200/60 flex flex-col justify-between w-full">
              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                  <FiMessageSquare className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Send us a Message</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Your Name *</label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Email Address *</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Subject</label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                      placeholder="Product inquiry, warranty assistance, etc."
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Message Details *</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 resize-none h-[140px]"
                      placeholder="Type details of your requirement..."
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 shadow-md shadow-blue-500/20 hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {loading ? 'Sending Request...' : <><FiSend /> Send Message</>}
                  </button>
                </form>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Google Mapping Frame section */}
      <section className="w-full bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-slate-200/60 rounded-3xl p-6 md:p-10 mt-6 mx-4 max-w-[calc(100%-2rem)] shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 items-center min-w-0">
          
          <Reveal className="w-full lg:w-1/2 text-left space-y-6">
            <span className="text-[10px] font-extrabold tracking-widest text-brand-blue uppercase bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full inline-block">
              Store Locator
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Visit Our Showroom in <span className="bg-gradient-to-r from-brand-blue to-purple-600 bg-clip-text text-transparent">Virudhachalam</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">
              Drop by to experience and test the latest flagships and mobile accessories in person. Our experts are ready to help you find your next phone.
            </p>
            <div className="space-y-4 pt-1 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-xs">📍</div>
                <span>Opposite Bus Stand, Junction Road, Virudhachalam</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-xs">🏥</div>
                <span className="text-slate-600 font-medium">Near Agarwal Eye Hospital</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-xs">🚗</div>
                <span className="text-slate-600 font-medium">Ample free customer parking available</span>
              </div>
            </div>
            <div className="pt-2">
              <a 
                href="https://maps.google.com/?q=AK+Mobiles+Junction+Road+Virudhachalam" 
                target="_blank" 
                rel="noreferrer" 
                className="px-8 py-3.5 text-sm bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blueHover hover:to-purple-700 text-white font-extrabold rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-md transform hover:scale-103"
              >
                🗺️ See Location in Google Maps &rarr;
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="w-full lg:w-1/2 min-w-0">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-72 sm:h-96 w-full group bg-white">
              <iframe 
                title="AK Mobiles Virudhachalam Store Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.0267232231265!2d79.3214532!3d11.5123412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a54d5cb52fe5fbf%3A0x7d6f51947b0aee0f!2sJunction+Rd%2C+Virudhachalam%2C+Tamil+Nadu+606001!5e0!3m2!1sen!2sin!4v1721124400000!5m2!1sen!2sin"
                className="w-full h-full border-0 grayscale-[15%] contrast-[105%] rounded-2xl"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-lg flex items-center justify-between transition-transform transform group-hover:translate-y-[-2px] pointer-events-none">
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-900 text-xs">AK Mobiles Store</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Opposite Bus Stand, Virudhachalam</p>
                </div>
                <span className="bg-gradient-to-r from-brand-blue to-purple-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                  Directions
                </span>
              </div>
            </div>
          </Reveal>

        </div>
      </section>
    </div>
  );
};

export default ContactPage;