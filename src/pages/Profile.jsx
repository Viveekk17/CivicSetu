import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faPhone, faCamera, faShieldAlt, 
  faCheckCircle, faTree, faCoins, faLeaf, faSave, faLock, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { getStoredUser, changePassword } from '../services/authService';
import { updateProfile, getProfile, uploadAvatar } from '../services/userService';

const Profile = () => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Fetch fresh profile data to ensure phone number etc. are loaded
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          setUser(response.data);
          setFormData(prev => ({
            ...prev,
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber || ''
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return setMessage({ type: 'error', text: 'Please select an image file' });
    }

    setAvatarLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await uploadAvatar(file);
      if (response.success) {
        setUser(response.data);
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        // Sync header
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: {} }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });

      if (response.success) {
        setUser(response.data);
        setEditMode(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Sync with Header etc.
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: {} }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }
    if (formData.newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
    }

    setLoading(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = [
    { label: 'Trees Planted', value: user?.impact?.treesPlanted || 0, icon: faTree, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'CO2 Saved', value: `${user?.impact?.pollutionSaved || 0}kg`, icon: faLeaf, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Credits Balance', value: user?.credits || 0, icon: faCoins, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Platform Rank', value: 'Eco Warrior', icon: faCheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Profile Header Banner */}
      <div className="h-48 md:h-64 w-full relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="relative inline-block group mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange} 
                />
                
                <div 
                  onClick={handleAvatarClick}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-4xl font-black text-white shadow-inner border-4 border-slate-900 group-hover:scale-105 transition-all overflow-hidden cursor-pointer relative"
                >
                  {avatarLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <FontAwesomeIcon icon={faSpinner} />
                    </motion.div>
                  ) : (user?.profilePicture && !user.profilePicture.includes('default-avatar.png')) ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user?.name)
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FontAwesomeIcon icon={faCamera} className="text-white text-xl" />
                  </div>
                </div>
                
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-1 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-900 text-white hover:bg-slate-700 transition-colors shadow-lg"
                >
                  {avatarLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" size="sm" /> : <FontAwesomeIcon icon={faCamera} size="sm" />}
                </button>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">{user?.name}</h2>
              <p className="text-slate-500 text-sm font-medium mb-6">{user?.email}</p>
              
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Impact Scorecard</p>
                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(0, 2).map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-4 rounded-2xl border border-slate-100`}>
                      <FontAwesomeIcon icon={stat.icon} className={`${stat.color} mb-2`} />
                      <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Platform Badges Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 hidden lg:block shadow-lg"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500" />
                Achievement Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Early Adopter', 'Waste Warrior', 'Green Citizen'].map((badge, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Settings Sections */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 font-medium ${
                    message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Information Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Personal Information</h3>
                    <p className="text-xs text-slate-500">Public data for your civic profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    editMode ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1">Full Name</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!editMode}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1">Email Address</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!editMode}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest px-1">Phone Number</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faPhone} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="tel" 
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          disabled={!editMode}
                          placeholder="+91 00000 00000"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><FontAwesomeIcon icon={faSave} /> Save Changes</>}
                      </button>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>

            {/* Security Section (Password) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <FontAwesomeIcon icon={faShieldAlt} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Security & Password</h3>
                    <p className="text-xs text-slate-500">Keep your account protected</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input 
                        type="password" 
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        placeholder="Verify current password"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input 
                            type="password" 
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Min 6 characters"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                          />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Repeat new password"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                          />
                        </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !formData.newPassword || !formData.currentPassword}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 font-black py-4 px-10 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span> : 'Update Password'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
