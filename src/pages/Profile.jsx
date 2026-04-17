import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faEnvelope, faPhone, faCamera, faShieldAlt,
  faCheckCircle, faTree, faCoins, faSave, faLock, faSpinner,
  faCrown, faAward, faEarthAmericas, faPencilAlt, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { getStoredUser, changePassword } from '../services/authService';
import { updateProfile, getProfile, uploadAvatar } from '../services/userService';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const Eyebrow = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
    {children}
  </p>
);

const StatTile = ({ icon, color, label, value }) => (
  <div
    className="rounded-xl md:rounded-2xl p-3 md:p-4 flex items-start gap-2.5 md:gap-3 min-w-0"
    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}
  >
    <div
      className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}1f`, color }}
    >
      <FontAwesomeIcon icon={icon} className="text-sm md:text-base" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-base md:text-lg font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px] md:text-[11px] mt-1 md:mt-1.5 font-semibold uppercase tracking-[0.12em] md:tracking-[0.14em] truncate" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  </div>
);

const Field = ({ icon, label, name, type = 'text', value, onChange, disabled, placeholder, accent = 'var(--primary)' }) => (
  <div className="space-y-2">
    <Eyebrow>{label}</Eyebrow>
    <div className="relative group">
      <FontAwesomeIcon
        icon={icon}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      />
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all disabled:opacity-60"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-primary)',
          '--tw-ring-color': accent,
        }}
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = accent; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)'; }}
      />
    </div>
  </div>
);

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
    { label: 'Trees Planted', value: user?.impact?.treesPlanted || 0, icon: faTree, color: '#22c55e' },
    { label: 'CO₂ Offset', value: `${user?.impact?.pollutionSaved || 0} kg`, icon: faEarthAmericas, color: '#14248a' },
    { label: 'Credits', value: user?.credits || 0, icon: faCoins, color: '#f59e0b' },
    { label: 'Rank', value: 'Eco Expert', icon: faCrown, color: '#998fc7' },
  ];

  const achievements = [
    { name: 'Early Adopter', color: '#22c55e' },
    { name: 'Waste Warrior', color: '#14248a' },
    { name: 'Pure Green', color: '#998fc7' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-5 md:space-y-6"
    >
      {/* Hero / Welcome Card */}
      <motion.div variants={item} className="card p-5 md:p-7 relative overflow-hidden">
        <div
          className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.25), transparent 70%)' }}
        />
        <div className="grid md:grid-cols-5 gap-5 md:gap-6 items-center relative z-10">
          {/* Left: identity */}
          <div className="md:col-span-3 flex items-center gap-4 md:gap-5">
            <div className="relative flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div
                onClick={handleAvatarClick}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold overflow-hidden cursor-pointer relative group ring-2"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: 'var(--border-light)',
                  '--tw-ring-color': 'var(--primary)',
                }}
              >
                {avatarLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin style={{ color: 'var(--text-tertiary)' }} />
                ) : (user?.profilePicture && !user.profilePicture.includes('default-avatar.png')) ? (
                  <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: 'var(--primary)' }}>{getInitials(user?.name)}</span>
                )}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FontAwesomeIcon icon={faCamera} className="text-white text-lg" />
                </div>
              </div>
              <button
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                <FontAwesomeIcon icon={faPencilAlt} className="text-xs" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <Eyebrow>Welcome back</Eyebrow>
              <h1 className="text-lg sm:text-xl md:text-3xl font-bold mt-1 md:mt-1.5 truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Citizen'}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 md:mt-2 min-w-0">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                <p className="text-xs md:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Right: rank panel */}
          <div
            className="md:col-span-2 rounded-2xl p-4 md:p-5"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}
          >
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Civic Rank</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <FontAwesomeIcon icon={faCrown} className="text-base md:text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold leading-none">Eco Expert</p>
                <p className="text-[11px] md:text-xs opacity-80 mt-1">{user?.credits || 0} credits earned</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-4 flex items-center gap-3"
            style={{
              borderLeft: `3px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: message.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: message.type === 'success' ? '#22c55e' : '#ef4444',
              }}
            >
              <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faShieldAlt} />
            </div>
            <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{message.text}</p>
            <button onClick={() => setMessage({ type: '', text: '' })} style={{ color: 'var(--text-tertiary)' }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Personal details (2 cols) */}
        <motion.div variants={item} className="card p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-5 md:mb-6 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(20, 36, 138, 0.1)', color: 'var(--primary)' }}
              >
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="min-w-0">
                <Eyebrow>Personal Details</Eyebrow>
                <h2 className="text-sm md:text-base font-bold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
                  Account Information
                </h2>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`${editMode ? 'btn btn-outline' : 'btn btn-primary'} text-xs md:text-sm py-2 px-3 md:py-2.5 md:px-4 flex-shrink-0`}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <Field
                icon={faUser} label="Full Name" name="name"
                value={formData.name} onChange={handleChange} disabled={!editMode}
                accent="var(--primary)"
              />
              <Field
                icon={faEnvelope} label="Email Address" name="email" type="email"
                value={formData.email} onChange={handleChange} disabled={!editMode}
                accent="#14248a"
              />
              <Field
                icon={faPhone} label="Phone Number" name="phoneNumber" type="tel"
                value={formData.phoneNumber} onChange={handleChange} disabled={!editMode}
                placeholder="+91 00000 00000" accent="#998fc7"
              />
            </div>

            <AnimatePresence>
              {editMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <button type="submit" disabled={loading} className="btn btn-primary mt-2 w-full md:w-auto">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faSave} /> Save Changes</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Achievements (1 col) */}
        <motion.div variants={item} className="card p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(153, 143, 199, 0.15)', color: '#998fc7' }}
            >
              <FontAwesomeIcon icon={faAward} />
            </div>
            <div>
              <Eyebrow>Achievements</Eyebrow>
              <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                Your Badges
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((b) => (
              <span
                key={b.name}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-transform hover:scale-105"
                style={{
                  background: `${b.color}14`,
                  color: b.color,
                  border: `1px solid ${b.color}33`,
                }}
              >
                {b.name}
              </span>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <Eyebrow>Next milestone</Eyebrow>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Reach <strong style={{ color: 'var(--text-primary)' }}>500 credits</strong> to unlock the
              <span style={{ color: '#f59e0b' }}> Eco Champion</span> badge.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Password card */}
      <motion.div variants={item} className="card p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5 md:mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
          >
            <FontAwesomeIcon icon={faLock} />
          </div>
          <div>
            <Eyebrow>Security</Eyebrow>
            <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              Password Management
            </h2>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 md:space-y-5">
          <Field
            icon={faShieldAlt} label="Current Password" name="currentPassword" type="password"
            value={formData.currentPassword} onChange={handleChange}
            placeholder="••••••••" accent="#f59e0b"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <Field
              icon={faLock} label="New Password" name="newPassword" type="password"
              value={formData.newPassword} onChange={handleChange}
              placeholder="Min 6 characters" accent="#22c55e"
            />
            <Field
              icon={faShieldAlt} label="Confirm Password" name="confirmPassword" type="password"
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="Repeat password" accent="#998fc7"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !formData.newPassword || !formData.currentPassword}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <>Update Password</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
