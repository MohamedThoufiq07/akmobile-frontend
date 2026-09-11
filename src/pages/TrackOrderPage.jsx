import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiAlertTriangle, FiCheckCircle, FiInbox } from 'react-icons/fi';
import { TrackOrderSkeleton, PageSkeleton } from '../components/ui/skeleton';
import logo from '../assets/logo_dark_text.png';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [searched, setSearched] = useState(false);

  // Mock tracking timelines depending on the entered order ID prefix
  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!orderId.trim() || !contactInfo.trim()) return;

    setLoading(true);
    setError(null);
    setTrackingData(null);
    setSearched(true);

    // Simulate API fetch delay
    setTimeout(() => {
      // Input Validation Mock
      if (orderId.toLowerCase().includes('fail') || orderId.length < 4) {
        setError('Order ID not found. Please double-check your credentials and try again.');
        setLoading(false);
        return;
      }

      // Valid Order ID simulated data
      const mockTimeline = [
        { status: 'Pending', desc: 'Order placed and payment verified', time: 'July 28, 2026 10:15 AM', current: false, completed: true },
        { status: 'Processing', desc: 'Packed and verified at Virudhachalam warehouse', time: 'July 28, 2026 03:30 PM', current: false, completed: true },
        { status: 'Shipped', desc: 'Dispatched via Blue Dart (AWB: 832948293)', time: 'July 29, 2026 09:00 AM', current: true, completed: true },
        { status: 'Out for Delivery', desc: 'Arrived at delivery hub near your location', time: 'Pending dispatch', current: false, completed: false },
        { status: 'Delivered', desc: 'Will be delivered to your shipping address', time: 'Estimated: July 31, 2026', current: false, completed: false }
      ];

      setTrackingData({
        orderId: orderId.toUpperCase(),
        carrier: 'Blue Dart',
        trackingNumber: 'BD-832948293-IN',
        estimatedDelivery: 'July 31, 2026',
        timeline: mockTimeline
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Helmet>
        <title>Track Order | AK Mobiles</title>
        <meta name="description" content="Track your order status live. Enter your Order ID and email/phone to check real-time shipment updates." />
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
            Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-blue">Order</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base font-bold max-w-xl mx-auto">
            Enter your transaction tracking details to view the real-time shipping progress.
          </p>
        </div>
      </section>

      {/* Tracking Form Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FiSearch className="text-brand-blue" />
              Tracking Details
            </h3>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Order ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AK-10294"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="input-field py-2.5 text-sm bg-white/90 border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email or Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="you@example.com / 9876543210"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="input-field py-2.5 text-sm bg-white/90 border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-premium py-3 text-xs font-bold disabled:opacity-75"
              >
                {loading ? 'Fetching status...' : 'Track Order'}
              </button>
            </form>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading && (
                <PageSkeleton loading={true} statusText="Retrieving your order details...">
                  <TrackOrderSkeleton />
                </PageSkeleton>
              )}

              {!loading && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-rose-200 bg-rose-50/10 p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                    <FiAlertTriangle size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-base">Tracking Failed</h4>
                  <p className="text-slate-550 text-xs max-w-sm">{error}</p>
                </motion.div>
              )}

              {!loading && !searched && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-400"
                >
                  <FiInbox size={48} className="text-slate-350 mb-3" />
                  <p className="font-bold text-sm">No active tracking search</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Submit your Order ID and contact details on the left to see live shipping progression.</p>
                </motion.div>
              )}

              {!loading && trackingData && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6"
                >
                  {/* Summary Block */}
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Order Reference</span>
                      <h4 className="text-lg font-black text-slate-950">{trackingData.orderId}</h4>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Estimated Arrival</span>
                      <p className="text-sm font-bold text-brand-blue">{trackingData.estimatedDelivery}</p>
                    </div>
                  </div>

                  {/* Stepper Timeline */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {trackingData.timeline.map((step, idx) => (
                      <div key={idx} className="relative flex flex-col items-start gap-1">
                        {/* Dot indicator */}
                        <div 
                          className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300 ${
                            step.current
                              ? 'border-brand-blue ring-4 ring-brand-blue/15'
                              : step.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-200'
                          }`}
                        >
                          {step.completed && !step.current && <FiCheckCircle size={10} className="text-white" />}
                        </div>

                        <div className="flex justify-between items-center w-full gap-4">
                          <span className={`text-sm font-bold ${step.current ? 'text-brand-blue' : step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{step.time}</span>
                        </div>
                        <p className={`text-xs ${step.current ? 'text-slate-700' : 'text-slate-500'}`}>
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Courier detail banner */}
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">Carrier Partner</span>
                      <p className="font-bold text-slate-800">{trackingData.carrier}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">AWB Tracking Number</span>
                      <p className="font-bold text-slate-800 font-mono">{trackingData.trackingNumber}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
