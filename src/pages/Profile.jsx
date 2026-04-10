import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faPhone, faCamera, faShieldAlt, 
  faCheckCircle, faTree, faCoins, faLeaf, faSave, faLock, faSpinner,
  faCrown, faAward, faEarthAmericas, faPencilAlt
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
    { label: 'Trees Planted', value: user?.impact?.treesPlanted || 0, icon: faTree, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
    { label: 'CO2 Offset', value: `${user?.impact?.pollutionSaved || 0}kg`, icon: faEarthAmericas, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)' },
    { label: 'Credits', value: user?.credits || 0, icon: faCoins, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
    { label: 'Rank', value: 'Eco Expert', icon: faCrown, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center shadow-2xl shadow-slate-200/40 relative overflow-hidden group"
            >
              <div className="relative inline-block mb-10">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange} 
                />
                
                {/* Moving Colors Animated Rings */}
                <div className="absolute inset-[-10px] rounded-full border border-slate-50 shadow-sm" />
                <div className="absolute inset-[-10px] rounded-full border-t-2 border-emerald-500 animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-[-10px] rounded-full border-r-2 border-blue-500/50 animate-[spin_5s_linear_infinite] delay-75" />
                <div className="absolute inset-[-10px] rounded-full border-b-2 border-amber-500/30 animate-[spin_8s_linear_infinite] delay-150" />

                <div 
                  onClick={handleAvatarClick}
                  className="w-36 h-36 rounded-full bg-slate-50 flex items-center justify-center text-4xl font-black shadow-inner border-4 border-white group-hover:scale-105 transition-all duration-500 overflow-hidden cursor-pointer relative z-10 mx-auto"
                >
                  {avatarLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <FontAwesomeIcon icon={faSpinner} className="text-slate-300" />
                    </motion.div>
                  ) : (user?.profilePicture && !user.profilePicture.includes('default-avatar.png')) ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="bg-gradient-to-br from-emerald-500 to-blue-600 bg-clip-text text-transparent">
                      {getInitials(user?.name)}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <FontAwesomeIcon icon={faCamera} className="text-slate-700 text-2xl" />
                  </div>
                </div>
                
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-1 w-11 h-11 bg-white text-emerald-600 rounded-full flex items-center justify-center border border-slate-100 shadow-lg hover:bg-slate-50 transition-all z-20 scale-90 group-hover:scale-100"
                >
                  <FontAwesomeIcon icon={faPencilAlt} size="sm" />
                </button>
              </div>

              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{user?.name}</h2>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-slate-500 text-sm font-semibold">{user?.email}</p>
              </div>
              
              <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-colors group/stat text-left">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover/stat:scale-110 transition-transform" style={{ background: stat.bg }}>
                      <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-sm" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 mb-0.5">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40"
            >
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faAward} className="text-indigo-500" />
                Your Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Early Adopter', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { name: 'Waste Warrior', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { name: 'Pure Green', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
                ].map((badge, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:scale-105 cursor-default ${badge.color}`}>
                    {badge.name}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Information Forms (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence>
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-5 rounded-3xl flex items-center gap-4 font-bold shadow-xl border ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faShieldAlt} />
                  </div>
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40"
            >
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl border border-blue-100">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Personal Details</h3>
                    <p className="text-sm text-slate-500">Your information across CivicSetu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 ${
                    editMode ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                  }`}
                >
                  {editMode ? 'Cancel Edit' : 'Modify Profile'}
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Display Name</label>
                      <div className="relative group/input">
                        <FontAwesomeIcon icon={faUser} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within/input:text-emerald-500" />
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!editMode}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white focus:ring-[6px] focus:ring-emerald-500/10 disabled:opacity-50 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Primary Email</label>
                      <div className="relative group/input">
                        <FontAwesomeIcon icon={faEnvelope} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within/input:text-blue-500" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!editMode}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-500 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 disabled:opacity-50 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Mobile Reference</label>
                      <div className="relative group/input">
                        <FontAwesomeIcon icon={faPhone} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within/input:text-indigo-500" />
                        <input 
                          type="tel" 
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          disabled={!editMode}
                          placeholder="+91 00000 00000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/10 disabled:opacity-50 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {editMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-4"
                      >
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                        >
                          {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <><FontAwesomeIcon icon={faSave} /> Save Profile Changes</>}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-xl border border-amber-100">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Password Management</h3>
                  <p className="text-sm text-slate-500">Keep your account access secure</p>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleChangePassword} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Current Password</label>
                    <div className="relative group/input">
                      <FontAwesomeIcon icon={faShieldAlt} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200 transition-colors group-focus-within/input:text-amber-500" />
                      <input 
                        type="password" 
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-200 outline-none focus:border-amber-500 focus:bg-white focus:ring-[6px] focus:ring-amber-500/10 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">New Password</label>
                        <div className="relative group/input">
                          <FontAwesomeIcon icon={faLock} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200 transition-colors group-focus-within/input:text-emerald-500" />
                          <input 
                            type="password" 
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Min 6 characters"
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-200 outline-none focus:border-emerald-500 focus:bg-white focus:ring-[6px] focus:ring-emerald-500/10 transition-all font-semibold"
                          />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-2">Confirm New Password</label>
                        <div className="relative group/input">
                          <FontAwesomeIcon icon={faShieldAlt} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-200 transition-colors group-focus-within/input:text-indigo-500" />
                          <input 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Repeat new secret"
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/10 transition-all font-semibold"
                          />
                        </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !formData.newPassword || !formData.currentPassword}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-2xl transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Update Password'}
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
