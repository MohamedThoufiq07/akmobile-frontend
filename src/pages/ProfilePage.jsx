import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/useAuth';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiLogOut } from 'react-icons/fi';
import { ProfileSkeleton, PageSkeleton } from '../components/ui/skeleton';
import { Reveal } from '../components/ui/animations';

const ProfilePage = () => {
  const { user, loading, isAuthenticated, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine1: user?.addresses?.[0]?.addressLine1 || '',
    addressLine2: user?.addresses?.[0]?.addressLine2 || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    postalCode: user?.addresses?.[0]?.postalCode || ''
  }));

  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      addressLine1: user.addresses?.[0]?.addressLine1 || '',
      addressLine2: user.addresses?.[0]?.addressLine2 || '',
      city: user.addresses?.[0]?.city || '',
      state: user.addresses?.[0]?.state || '',
      postalCode: user.addresses?.[0]?.postalCode || ''
    });
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await updateProfile({
      name: formData.name,
      phone: formData.phone,
      addresses: [{
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        isDefault: true
      }]
    });
    
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <PageSkeleton loading={true} statusText="Loading profile, please wait...">
        <ProfileSkeleton />
      </PageSkeleton>
    );
  }
  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>My Profile | AK Mobiles</title>
      </Helmet>

      <div className="bg-slate-50 py-12 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar */}
            <Reveal className="md:w-1/3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden md:sticky md:top-24">
                <div className="bg-brand-dark p-6 sm:p-8 text-center relative">
                  <div className="w-24 h-24 bg-white text-brand-dark rounded-full mx-auto flex items-center justify-center text-4xl font-bold uppercase shadow-lg z-10 relative">
                    {user.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-bold text-white mt-4">{user.name}</h2>
                  <p className="text-slate-300 text-sm">{user.email}</p>
                </div>
                
                <div className="p-4">
                  <ul className="space-y-2">
                    <li>
                      <Link to="/profile" className="flex items-center gap-3 w-full p-3 bg-orange-50 text-brand-orange font-semibold rounded-lg">
                        <FiUser /> Profile Settings
                      </Link>
                    </li>
                    <li>
                      <Link to="/my-orders" className="flex items-center gap-3 w-full p-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                        <FiMapPin /> My Orders
                      </Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium text-left">
                        <FiLogOut /> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Main Content */}
            <Reveal delay={0.1} className="md:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">Profile Settings</h1>
                
                <form onSubmit={handleSubmit}>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <FiUser />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-field pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <FiMail />
                        </div>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="input-field pl-10 bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <FiPhone />
                        </div>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input-field pl-10"
                          placeholder="e.g. +91 9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Default Shipping Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address Line 1</label>
                      <input
                        type="text"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="House No, Building, Street"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Landmark, Area"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">PIN Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex items-center gap-2 w-full sm:w-auto sm:min-w-[150px] py-3 justify-center disabled:opacity-70"
                    >
                      {isSubmitting ? 'Saving...' : <><FiSave /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
