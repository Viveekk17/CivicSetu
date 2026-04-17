import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSeedling, faBrain, faTree, faCoins,
  faShieldHalved, faArrowRight, faXmark, faEnvelope, faLock,
  faUser, faUserShield, faSpinner, faCheckCircle, faMapMarkerAlt,
  faUsers, faHandHoldingHeart, faBolt
} from '@fortawesome/free-solid-svg-icons';
import { login, register, googleLogin, adminLogin, isAuthenticated } from '../services/authService';
import { getGlobalImpact } from '../services/api';
import BrandLogo from '../components/common/BrandLogo';
import { SetuLandscape, CountUp } from '../components/dashboard/HeroBanner';

/* ============================================================
   AUTH MODAL — tabs: Sign In · Sign Up · Admin
   ============================================================ */
const AuthModal = ({ open, onClose, initialTab = 'signin' }) => {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError('');
    }
  }, [open, initialTab]);

  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login(signinForm);
      if (res.success) window.location.assign('/');
      else setError(res.message || 'Login failed');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await register(signupForm);
      if (res.success) window.location.assign('/');
      else setError(res.message || 'Registration failed');
    } catch (err) {
      setError(err.message || 'Could not create account');
    } finally { setLoading(false); }
  };

  const handleAdmin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await adminLogin(adminForm);
      if (res.success) window.location.assign('/admin');
      else setError(res.message || 'Admin login failed');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const res = await googleLogin();
      if (res?.success) window.location.assign('/');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'signin', label: 'Sign In',  icon: faUser },
    { id: 'signup', label: 'Sign Up',  icon: faSeedling },
    { id: 'admin',  label: 'Admin',    icon: faUserShield },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background: 'rgba(20, 36, 138, 0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 8  }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl overflow-hidden relative"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 194, 252, 0.6)',
              boxShadow: '0 30px 80px rgba(20, 36, 138, 0.18), 0 0 0 1px rgba(255,255,255,0.4) inset',
            }}
          >
            <div
              className="h-1 w-full"
              style={{ background: 'linear-gradient(90deg, #14248a 0%, #998fc7 50%, #d4c2fc 100%)' }}
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:rotate-90 z-10"
              style={{ background: 'rgba(20,36,138,0.06)', color: '#14248a' }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="p-7 md:p-8">
              <div className="text-center mb-6">
                <motion.div
                  key={tab}
                  initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg, #14248a, #998fc7)', color: '#fff' }}
                >
                  <FontAwesomeIcon icon={tab === 'admin' ? faUserShield : faSeedling} />
                </motion.div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#28262c' }}>
                  {tab === 'signin' && 'Welcome back'}
                  {tab === 'signup' && 'Join CivicSetu'}
                  {tab === 'admin'  && 'Admin Portal'}
                </h2>
                <p className="text-xs md:text-sm mt-1" style={{ color: '#5a5760' }}>
                  {tab === 'signin' && 'Sign in to continue your civic journey'}
                  {tab === 'signup' && 'Create your account in seconds'}
                  {tab === 'admin'  && 'Restricted — authorized officers only'}
                </p>
              </div>

              <div
                className="flex gap-1 p-1 rounded-xl mb-5"
                style={{ background: 'rgba(20, 36, 138, 0.05)' }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(''); }}
                    className="flex-1 px-2 md:px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: tab === t.id ? '#fff' : 'transparent',
                      color: tab === t.id ? '#14248a' : '#5a5760',
                      boxShadow: tab === t.id ? '0 2px 8px rgba(20, 36, 138, 0.1)' : 'none',
                    }}
                  >
                    <FontAwesomeIcon icon={t.icon} className="text-[11px]" />
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 px-3 py-2.5 rounded-lg text-xs font-medium"
                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {tab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-3.5">
                      <ModalField
                        icon={faEnvelope} type="email" placeholder="you@example.com"
                        value={signinForm.email}
                        onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })}
                        required
                      />
                      <ModalField
                        icon={faLock} type="password" placeholder="••••••••"
                        value={signinForm.password}
                        onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                        required
                      />
                      <ModalSubmit loading={loading}>Sign In</ModalSubmit>
                    </form>
                  )}

                  {tab === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-3.5">
                      <ModalField
                        icon={faUser} type="text" placeholder="Your full name"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        required
                      />
                      <ModalField
                        icon={faEnvelope} type="email" placeholder="you@example.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                      <ModalField
                        icon={faLock} type="password" placeholder="Min 6 characters"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required minLength={6}
                      />
                      <ModalSubmit loading={loading}>Create Account</ModalSubmit>
                    </form>
                  )}

                  {tab === 'admin' && (
                    <form onSubmit={handleAdmin} className="space-y-3.5">
                      <ModalField
                        icon={faEnvelope} type="email" placeholder="admin@civicsetu.in"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        required
                      />
                      <ModalField
                        icon={faLock} type="password" placeholder="Admin password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        required
                      />
                      <ModalSubmit loading={loading}>Access Admin Portal</ModalSubmit>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>

              {tab !== 'admin' && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'rgba(20,36,138,0.1)' }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.92)', color: '#8a8590' }}>
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    type="button"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5"
                    style={{
                      background: '#fff',
                      border: '1.5px solid #d4c2fc',
                      color: '#28262c',
                      boxShadow: '0 1px 2px rgba(20, 36, 138, 0.04)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#998fc7'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(20, 36, 138, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4c2fc'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(20, 36, 138, 0.04)'; }}
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                    Continue with Google
                  </button>
                </>
              )}

              <p className="text-center text-xs mt-5" style={{ color: '#5a5760' }}>
                {tab === 'signin' && (
                  <>New here?{' '}
                    <button onClick={() => setTab('signup')} className="font-bold transition-colors hover:underline" style={{ color: '#14248a' }}>
                      Create an account
                    </button>
                  </>
                )}
                {tab === 'signup' && (
                  <>Already a citizen?{' '}
                    <button onClick={() => setTab('signin')} className="font-bold transition-colors hover:underline" style={{ color: '#14248a' }}>
                      Sign in
                    </button>
                  </>
                )}
                {tab === 'admin' && (
                  <>Not an admin?{' '}
                    <button onClick={() => setTab('signin')} className="font-bold transition-colors hover:underline" style={{ color: '#14248a' }}>
                      Citizen sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ModalField = ({ icon, ...props }) => (
  <div className="relative group">
    <FontAwesomeIcon
      icon={icon}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors"
      style={{ color: '#8a8590' }}
    />
    <input
      {...props}
      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
      style={{
        background: '#f9f5ff',
        border: '1.5px solid #ebe3ff',
        color: '#28262c',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#14248a';
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 36, 138, 0.08)';
        e.currentTarget.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#ebe3ff';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = '#f9f5ff';
      }}
    />
  </div>
);

const ModalSubmit = ({ loading, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
    style={{
      background: 'linear-gradient(135deg, #14248a 0%, #1e3aa8 100%)',
      boxShadow: '0 6px 20px rgba(20, 36, 138, 0.3)',
    }}
    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 28px rgba(20, 36, 138, 0.4)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(20, 36, 138, 0.3)'; }}
  >
    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <>{children} <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>}
  </button>
);

/* ============================================================
   GLOBE — India transformation scene
   STORY: A globe centered on India. The CivicSetu logo sweeps
   left→right; everywhere it passes, smog clears and India
   turns from scorched brown to lush green.
   ============================================================ */
const WIPE_DURATION = 11;
const WIPE_TIMES   = [0, 0.08, 0.46, 0.88, 1];
const BADGE_LEFT   = ['12.5%', '12.5%', '87.5%', '87.5%', '12.5%'];

// Approximate silhouette of India centered on viewBox (200, 200)
const INDIA_PATH =
  'M 178 132 ' +
  'C 195 128 220 128 240 134 ' +
  'C 252 142 256 156 254 168 ' +
  'C 248 174 240 172 232 172 ' +
  'C 240 182 248 198 246 215 ' +
  'C 240 240 226 262 212 280 ' +
  'C 205 290 198 292 192 286 ' +
  'C 180 274 170 256 164 238 ' +
  'C 156 218 152 198 156 178 ' +
  'C 148 168 146 158 152 150 ' +
  'C 162 140 170 136 178 132 Z';

// Major Indian cities (approx positions on the path)
const CITIES = [
  { x: 195, y: 150 }, // Delhi
  { x: 175, y: 200 }, // Mumbai
  { x: 220, y: 195 }, // Kolkata
  { x: 200, y: 245 }, // Bangalore/Chennai area
  { x: 205, y: 275 }, // Madurai/southern
];

const Globe = () => (
  <div
    className="relative w-full aspect-square max-w-[540px] mx-auto my-10"
    style={{ transform: 'translateZ(0)', overflow: 'visible' }}
  >
    {/* Single soft ambient glow */}
    <div
      className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(20, 36, 138, 0.18), transparent 65%)' }}
    />

    {/* Subtle outer dashed ring */}
    <motion.div
      className="absolute inset-0 rounded-full border border-dashed pointer-events-none"
      style={{ borderColor: 'rgba(20, 36, 138, 0.15)' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
    />

    {/* THE GLOBE */}
    <svg
      viewBox="0 0 400 400"
      className="absolute inset-0 w-full h-full"
      style={{ filter: 'drop-shadow(0 25px 50px rgba(20, 36, 138, 0.28))' }}
    >
      <defs>
        <radialGradient id="pollSphere" cx="35%" cy="32%" r="78%">
          <stop offset="0%"   stopColor="#a8a29e" />
          <stop offset="55%"  stopColor="#57534e" />
          <stop offset="100%" stopColor="#1c1917" />
        </radialGradient>
        <radialGradient id="cleanSphere" cx="35%" cy="32%" r="78%">
          <stop offset="0%"   stopColor="#93c5fd" />
          <stop offset="50%"  stopColor="#1e40af" />
          <stop offset="100%" stopColor="#14248a" />
        </radialGradient>
        <radialGradient id="hilite" cx="28%" cy="22%" r="42%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="puff" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(40, 35, 30, 0.95)" />
          <stop offset="100%" stopColor="rgba(40, 35, 30, 0)" />
        </radialGradient>

        <linearGradient id="wipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" />
          <stop offset="44%"  stopColor="white" />
          <stop offset="56%"  stopColor="black" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <mask id="wipeMask" maskUnits="userSpaceOnUse">
          <motion.rect
            y="0" width="800" height="400" fill="url(#wipeGrad)"
            animate={{ x: [-400, -400, 0, 0, -400] }}
            transition={{ duration: WIPE_DURATION, times: WIPE_TIMES, repeat: Infinity, ease: 'easeInOut' }}
          />
        </mask>

        <clipPath id="sphereClip">
          <circle cx="200" cy="200" r="150" />
        </clipPath>
      </defs>

      {/* === POLLUTED EARTH (base layer) === */}
      <g clipPath="url(#sphereClip)">
        <circle cx="200" cy="200" r="150" fill="url(#pollSphere)" />
        {/* India silhouette — scorched */}
        <path d={INDIA_PATH} fill="#3f2e1d" />
        {/* Sri Lanka */}
        <ellipse cx="215" cy="298" rx="6" ry="9" fill="#3f2e1d" />
        {/* Industry markers + smoke columns over India */}
        {CITIES.map((c, i) => (
          <rect key={`mk-${i}`} x={c.x - 1.2} y={c.y - 2.5} width="2.4" height="4" fill="#0f0a05" />
        ))}
        {CITIES.map((c, i) => (
          <motion.circle
            key={`puff-${i}`}
            cx={c.x}
            fill="url(#puff)"
            animate={{
              cy: [c.y - 3, c.y - 22, c.y - 42],
              r: [2.5, 6, 10],
              opacity: [0.8, 0.55, 0],
            }}
            transition={{ duration: 2.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </g>

      {/* === CLEAN EARTH (revealed by wipe) === */}
      <g clipPath="url(#sphereClip)" mask="url(#wipeMask)">
        <circle cx="200" cy="200" r="150" fill="url(#cleanSphere)" />
        {/* India silhouette — lush green */}
        <path d={INDIA_PATH} fill="#16a34a" />
        {/* Sri Lanka */}
        <ellipse cx="215" cy="298" rx="6" ry="9" fill="#16a34a" />
        {/* Tiny tree silhouettes on India */}
        {CITIES.map((c, i) => (
          <g key={`tree-${i}`}>
            <rect x={c.x - 0.4} y={c.y} width="0.8" height="2.4" fill="#854d0e" />
            <circle cx={c.x} cy={c.y - 0.5} r="2" fill="#bbf7d0" />
          </g>
        ))}
        {/* Bloom sparkles on India */}
        {[[185, 165], [210, 220], [195, 260], [175, 175]].map(([cx, cy], i) => (
          <motion.circle
            key={`bloom-${i}`}
            cx={cx} cy={cy} r="1.4"
            fill="#fef3c7"
            animate={{ opacity: [0.4, 1, 0.4], r: [1, 2.2, 1] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
      </g>

      {/* Lat/Long grid */}
      <g clipPath="url(#sphereClip)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" fill="none">
        <ellipse cx="200" cy="200" rx="150" ry="40" />
        <ellipse cx="200" cy="200" rx="150" ry="80" />
        <ellipse cx="200" cy="200" rx="150" ry="120" />
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        >
          <ellipse cx="200" cy="200" rx="40" ry="150" />
          <ellipse cx="200" cy="200" rx="80" ry="150" />
          <ellipse cx="200" cy="200" rx="120" ry="150" />
        </motion.g>
      </g>

      {/* Sphere highlight + outline */}
      <circle cx="200" cy="200" r="150" fill="url(#hilite)" pointerEvents="none" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(20, 36, 138, 0.3)" strokeWidth="1.2" />

      {/* Glowing wipe boundary */}
      <g clipPath="url(#sphereClip)">
        <motion.g
          animate={{ x: [-400, -400, 0, 0, -400] }}
          transition={{ duration: WIPE_DURATION, times: WIPE_TIMES, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="400" x2="400" y1="20" y2="380"
                stroke="#86efac" strokeWidth="14" opacity="0.35"
                strokeLinecap="round" filter="blur(6px)" />
          <line x1="400" x2="400" y1="40" y2="360"
                stroke="#22c55e" strokeWidth="2.5" opacity="0.95"
                strokeLinecap="round" />
          {[60, 120, 180, 240, 300, 340].map((y, i) => (
            <motion.circle
              key={i}
              cx="400" cy={y} r="1.8" fill="#fef3c7"
              animate={{ opacity: [0, 1, 0], r: [1, 3, 1] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.g>
      </g>
    </svg>

    {/* === CivicSetu LOGO leading the wipe === */}
    <motion.div
      className="absolute z-10"
      style={{ top: '-2%', transform: 'translate(-50%, 0)' }}
      animate={{ left: BADGE_LEFT }}
      transition={{ duration: WIPE_DURATION, times: WIPE_TIMES, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Pulsing green aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.5), transparent 70%)' }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="relative rounded-full bg-white p-1.5 flex items-center justify-center"
        style={{
          boxShadow: '0 14px 32px rgba(20, 36, 138, 0.4), 0 0 30px rgba(34,197,94,0.5)',
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogo size={48} />
      </motion.div>
      {/* Downward connector to wipe line */}
      <div
        className="absolute left-1/2 top-full -translate-x-1/2 w-px h-3"
        style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.8), transparent)' }}
      />
    </motion.div>

  </div>
);

/* ============================================================
   MAIN LANDING
   ============================================================ */
const PROCESS_STEPS = ['Capture', 'Verify', 'Earn', 'Restore'];

const PILLARS = [
  {
    label: 'Verification',
    icon: faBrain,
    title: 'Gemini Vision authenticity check',
    description:
      'Every photo is classified, scored, and screened for AI-generated fraud before a single credit is issued.',
    specLabel: 'Avg. decision',
    spec: '< 6 seconds',
  },
  {
    label: 'Provenance',
    icon: faMapMarkerAlt,
    title: 'EXIF + GPS metadata anchoring',
    description:
      'Submissions are pinned to camera-derived coordinates and timestamps — not user-entered claims.',
    specLabel: 'Anchored to',
    spec: 'Device EXIF',
  },
  {
    label: 'Restoration',
    icon: faHandHoldingHeart,
    title: 'Verified NGO redemption network',
    description:
      'Earned credits convert into on-ground tree plantations through NGO Darpan-listed partner organizations.',
    specLabel: 'Partners',
    spec: 'Darpan-verified',
  },
  {
    label: 'Community',
    icon: faUsers,
    title: 'Hyper-local civic cohorts',
    description:
      'Form neighbourhood groups, surface high-impact contributors, and rally citizens around measurable action.',
    specLabel: 'Scope',
    spec: 'Ward-level',
  },
];

// Lucid colored stat cards — glassmorphic, accented, animate-in.
const LUCID_STATS = [
  { key: 'civicActions',    label: 'Civic Actions',    icon: faCheckCircle, accent: '#34d399', tint: 'from-emerald-300/30 to-emerald-500/10' },
  { key: 'activeCitizens',  label: 'Active Citizens',  icon: faUsers,       accent: '#60a5fa', tint: 'from-sky-300/30 to-sky-500/10' },
  { key: 'treesPlanted',    label: 'Trees Planted',    icon: faTree,        accent: '#4ade80', tint: 'from-green-300/30 to-green-500/10' },
  { key: 'creditsRedeemed', label: 'Credits Redeemed', icon: faCoins,       accent: '#fbbf24', tint: 'from-amber-300/30 to-amber-500/10' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [globalImpact, setGlobalImpact] = useState(null);

  // Already authenticated → skip the marketing page entirely
  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Phase 'intro' = full hero with stat cards + landscape animation.
  // Phase 'split' = the cleanup animation has resolved; the layout splits
  // into a bigger centered headline on the left and a flowing-down auth
  // panel on the right. SetuLandscape narrative runs ~11s; flip a touch
  // after to let the trees and air motes settle.
  const [phase, setPhase] = useState('intro');

  useEffect(() => {
    let alive = true;
    getGlobalImpact()
      .then((res) => { if (alive && res?.success) setGlobalImpact(res.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase('split'), 12500);
    return () => clearTimeout(t);
  }, []);

  const openAuth = (tab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #f9f5ff 0%, #ffffff 50%, #f9f5ff 100%)',
        color: '#28262c',
      }}
    >
      {/* Soft glows — static to avoid full-viewport repaints during scroll */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 194, 252, 0.45), transparent 70%)',
          transform: 'translate(-30%, -40%) translateZ(0)',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(153, 143, 199, 0.35), transparent 70%)',
          transform: 'translate(30%, 30%) translateZ(0)',
          willChange: 'transform',
        }}
      />

      {/* NAVBAR */}
      <header className="relative z-20">
        <div className="max-w-[1600px] mx-auto px-3 md:px-5 py-4 md:py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
              transition={{ duration: 0.5 }}
            >
              <BrandLogo size={40} />
            </motion.div>
            <span className="text-base md:text-lg font-bold tracking-tight" style={{ color: '#14248a' }}>
              CIVIC<span style={{ color: '#998fc7' }}>सेतु</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium" style={{ color: '#5a5760' }}>
            <a href="#features" className="transition-colors hover:text-[#14248a]">Features</a>
            <a href="#how" className="transition-colors hover:text-[#14248a]">How It Works</a>
            <Link to="/about" className="transition-colors hover:text-[#14248a]">About</Link>
          </nav>

          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div
                key="navauth"
                initial={false}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 md:gap-3"
              >
                <button
                  onClick={() => openAuth('admin')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    color: '#5a5760',
                    border: '1px solid #d4c2fc',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f5ff'; e.currentTarget.style.color = '#14248a'; e.currentTarget.style.borderColor = '#998fc7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a5760'; e.currentTarget.style.borderColor = '#d4c2fc'; }}
                >
                  <FontAwesomeIcon icon={faUserShield} className="text-[11px]" />
                  Admin
                </button>
                <button
                  onClick={() => openAuth('signin')}
                  className="px-3 md:px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={{ color: '#14248a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f5ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="relative overflow-hidden px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #14248a 0%, #1e3aa8 100%)',
                    boxShadow: '0 4px 14px rgba(20, 36, 138, 0.3)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 22px rgba(20, 36, 138, 0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(20, 36, 138, 0.3)'}
                >
                  <span className="relative z-10">Join Now</span>
                  <span
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)' }}
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* HERO */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-3 md:px-5 pt-6 md:pt-8 pb-16">
        {/* === LUCID STAT CARDS — only during intro phase === */}
        <AnimatePresence>
          {phase === 'intro' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mb-6 md:mb-8 overflow-hidden"
            >
              {LUCID_STATS.map(({ key, label, icon, accent }, i) => (
                <motion.div
                  key={key}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="relative rounded-xl p-2.5 md:p-3 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, #ffffff 0%, ${accent}10 100%)`,
                    border: `1px solid ${accent}40`,
                    boxShadow: `0 6px 18px -12px ${accent}66`,
                  }}
                >
                  <span
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl opacity-40 pointer-events-none"
                    style={{ background: accent }}
                  />
                  <div className="relative flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${accent}1f`, border: `1px solid ${accent}55` }}
                    >
                      <FontAwesomeIcon icon={icon} className="text-[11px]" style={{ color: accent }} />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <span
                        className="block text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] truncate"
                        style={{ color: '#5a5760' }}
                      >
                        {label}
                      </span>
                      <CountUp
                        value={globalImpact?.[key] ?? 0}
                        duration={1.6}
                        startDelay={0.5 + i * 0.1}
                        className="block text-lg md:text-xl lg:text-[22px] font-black tabular-nums leading-none mt-0.5"
                        style={{ color: '#14248a' }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === HERO ROW === */}
        <div className="grid lg:grid-cols-12 gap-4 lg:gap-8 items-center">
          {/* === COPY BLOCK — grows + recenters when phase flips === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`${phase === 'split' ? 'lg:col-span-6 lg:min-h-[520px] flex flex-col justify-center' : 'lg:col-span-3'}`}
            style={{ transition: 'min-height 0.7s ease' }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-semibold mb-4 self-start"
              style={{
                background: 'rgba(212, 194, 252, 0.3)',
                color: '#14248a',
                border: '1px solid rgba(153, 143, 199, 0.4)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-500" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Built for Bharat
            </motion.span>

            <motion.h1
              animate={{
                fontSize: phase === 'split' ? 64 : 44,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-bold tracking-tight leading-[1.05]"
              style={{ color: '#28262c' }}
            >
              Turn Civic Action Into{' '}
              <motion.span
                initial={{ backgroundPosition: '0% 50%' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'linear-gradient(120deg, #14248a 0%, #998fc7 40%, #d4c2fc 60%, #14248a 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                Verified Impact
              </motion.span>
              <span style={{ color: '#14248a' }}>.</span>
            </motion.h1>

            <motion.p
              animate={{ fontSize: phase === 'split' ? 18 : 15 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 leading-relaxed max-w-xl"
              style={{ color: '#5a5760' }}
            >
              AI-verified cleanups. Earn credits. Redeem for real trees through NGO partners.
            </motion.p>

            <AnimatePresence>
              {phase === 'intro' && (
                <motion.div
                  key="intro-ctas"
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 flex flex-col sm:flex-row gap-2 max-w-sm"
                >
                  <button
                    onClick={() => openAuth('signup')}
                    className="group relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs md:text-sm text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #14248a 0%, #1e3aa8 100%)',
                      boxShadow: '0 6px 18px rgba(20, 36, 138, 0.28)',
                    }}
                  >
                    <span className="relative z-10">Start Contributing</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px] relative z-10" />
                  </button>
                  <button
                    onClick={() => openAuth('signin')}
                    className="px-4 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all hover:-translate-y-0.5"
                    style={{
                      background: '#fff',
                      color: '#14248a',
                      border: '1.5px solid #d4c2fc',
                    }}
                  >
                    I have an account
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex flex-col gap-1.5">
              {[
                { icon: faCheckCircle, text: 'Gemini Vision Verified' },
                { icon: faShieldHalved, text: 'EXIF & GPS Anchored' },
                { icon: faBolt, text: 'Real-Time Scoring' },
              ].map((t, i) => (
                <motion.div
                  key={t.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    fontSize: phase === 'split' ? 14 : 12,
                  }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 font-medium"
                  style={{ color: '#5a5760' }}
                >
                  <FontAwesomeIcon icon={t.icon} className="text-emerald-500 text-[10px]" />
                  {t.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* === RIGHT COLUMN — animation OR auth panel === */}
          <div
            className={`${phase === 'split' ? 'lg:col-span-6' : 'lg:col-span-9'} relative`}
            style={{ transition: 'all 0.7s ease' }}
          >
            <AnimatePresence mode="wait">
              {phase === 'intro' ? (
                <motion.div
                  key="anim"
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(153, 143, 199, 0.16)',
                    contain: 'paint',
                    transform: 'translateZ(0)',
                  }}
                >
                  <SetuLandscape
                    className="relative w-full h-[280px] md:h-[380px] lg:h-[460px]"
                    opacity={0.75}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="authpanel"
                  initial={{ opacity: 0, x: 140, y: -180, scale: 0.55 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.95,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.15,
                  }}
                  className="lg:min-h-[520px] flex items-center"
                >
                  <div
                    className="w-full rounded-3xl p-6 md:p-8"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      border: '1px solid rgba(212, 194, 252, 0.55)',
                      boxShadow: '0 30px 70px -20px rgba(20, 36, 138, 0.25)',
                    }}
                  >
                    <div
                      className="h-1 w-16 rounded-full mb-5"
                      style={{ background: 'linear-gradient(90deg, #14248a 0%, #998fc7 50%, #d4c2fc 100%)' }}
                    />
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2"
                      style={{ color: '#998fc7' }}
                    >
                      Ready to begin
                    </p>
                    <h2
                      className="text-2xl md:text-[30px] font-bold tracking-tight leading-tight mb-2"
                      style={{ color: '#28262c' }}
                    >
                      Sign in to start contributing.
                    </h2>
                    <p className="text-sm md:text-[15px] leading-relaxed mb-6" style={{ color: '#5a5760' }}>
                      Join thousands of citizens earning verified impact credits across India.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => openAuth('signup')}
                        className="w-full group flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-sm md:text-base text-white transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #14248a 0%, #1e3aa8 100%)',
                          boxShadow: '0 8px 22px rgba(20, 36, 138, 0.3)',
                        }}
                      >
                        <FontAwesomeIcon icon={faSeedling} className="text-xs" />
                        Create Free Account
                        <FontAwesomeIcon icon={faArrowRight} className="text-[11px] transition-transform group-hover:translate-x-0.5" />
                      </button>

                      <button
                        onClick={() => openAuth('signin')}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm md:text-base transition-all hover:-translate-y-0.5"
                        style={{
                          background: '#fff',
                          color: '#14248a',
                          border: '1.5px solid #d4c2fc',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#998fc7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4c2fc'; }}
                      >
                        <FontAwesomeIcon icon={faUser} className="text-xs" />
                        Log In
                      </button>

                      <button
                        onClick={() => openAuth('admin')}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'transparent',
                          color: '#5a5760',
                          border: '1px solid #ebe3ff',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f5ff'; e.currentTarget.style.color = '#14248a'; e.currentTarget.style.borderColor = '#d4c2fc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a5760'; e.currentTarget.style.borderColor = '#ebe3ff'; }}
                      >
                        <FontAwesomeIcon icon={faUserShield} className="text-[11px]" />
                        Admin Portal
                      </button>
                    </div>

                    <div className="mt-5 pt-5 flex items-center justify-between gap-3 text-[11px]" style={{ borderTop: '1px solid #ebe3ff', color: '#8a8590' }}>
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
                        Verified by Gemini Vision
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* GLOBE SECTION — Bharat transformation, shifted below the hero */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
        >
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold mb-5"
              style={{
                background: 'rgba(34,197,94,0.10)',
                color: '#15803d',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Transformation
            </span>
            <h2
              className="text-2xl md:text-3xl lg:text-[40px] font-bold tracking-tight leading-tight"
              style={{ color: '#28262c' }}
            >
              Watch Bharat heal,{' '}
              <span style={{ color: '#14248a' }}>one civic action at a time.</span>
            </h2>
            <p className="mt-4 text-sm md:text-base leading-relaxed max-w-lg" style={{ color: '#5a5760' }}>
              Every verified cleanup, every planted tree, every reported issue helps shift the
              dial — from scorched brown to lush green. CivicSetu makes that journey visible.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs md:text-sm font-medium" style={{ color: '#5a5760' }}>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#78716c' }} />
                Polluted today
              </span>
              <span className="text-[#998fc7]">→</span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Healed with you
              </span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Globe />
          </motion.div>
        </motion.section>

        {/* PLATFORM — editorial trust architecture */}
        <motion.section
          id="platform"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-28"
        >
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left rail — section intro */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 self-start">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-sm" style={{ background: '#14248a' }} />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#14248a' }}>
                  Platform
                </p>
              </div>
              <h2
                className="text-2xl md:text-3xl lg:text-[36px] font-bold tracking-tight leading-[1.1]"
                style={{ color: '#28262c' }}
              >
                Engineered for verifiable civic action.
              </h2>
              <p className="mt-4 text-sm md:text-base leading-relaxed" style={{ color: '#5a5760' }}>
                CivicSetu pairs computer vision, metadata anchoring, and a verified NGO network into a
                single auditable trail — from sighting to tree.
              </p>

              {/* Tight process strip */}
              <div className="mt-7 flex items-center gap-2 flex-wrap">
                {PROCESS_STEPS.map((step, i) => (
                  <React.Fragment key={step}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#28262c' }}>
                      <span
                        className="text-[10px] font-mono tabular-nums"
                        style={{ color: '#998fc7' }}
                      >
                        0{i + 1}
                      </span>
                      {step}
                    </span>
                    {i < PROCESS_STEPS.length - 1 && (
                      <span className="text-[11px]" style={{ color: '#d4c2fc' }}>—</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right — capability rows */}
            <div
              className="lg:col-span-8 rounded-2xl overflow-hidden"
              style={{ border: '1px solid #ebe3ff', background: '#ebe3ff' }}
            >
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`grid grid-cols-12 gap-4 md:gap-6 p-5 md:p-6 items-start ${
                    i < PILLARS.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ background: '#fff', borderColor: '#ebe3ff' }}
                >
                  <div className="col-span-12 md:col-span-1 flex md:block items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: '#f9f5ff',
                        border: '1px solid #ebe3ff',
                        color: '#14248a',
                      }}
                    >
                      <FontAwesomeIcon icon={p.icon} className="text-sm" />
                    </span>
                    <span
                      className="md:hidden text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: '#998fc7' }}
                    >
                      {p.label}
                    </span>
                  </div>

                  <div className="col-span-12 md:col-span-7">
                    <p
                      className="hidden md:block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5"
                      style={{ color: '#998fc7' }}
                    >
                      {p.label}
                    </p>
                    <h3
                      className="text-base md:text-lg font-bold tracking-tight"
                      style={{ color: '#28262c' }}
                    >
                      {p.title}
                    </h3>
                    <p
                      className="mt-1.5 text-xs md:text-sm leading-relaxed"
                      style={{ color: '#5a5760' }}
                    >
                      {p.description}
                    </p>
                  </div>

                  <div className="col-span-12 md:col-span-4 md:text-right">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: '#8a8590' }}
                    >
                      {p.specLabel}
                    </p>
                    <p
                      className="mt-0.5 text-sm md:text-[15px] font-bold tabular-nums"
                      style={{ color: '#14248a' }}
                    >
                      {p.spec}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-28"
        >
          <div
            className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, #14248a 0%, #1e3aa8 50%, #998fc7 100%)',
              boxShadow: '0 20px 60px rgba(20, 36, 138, 0.3)',
            }}
          >
            {/* Animated radial accent */}
            <motion.div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.4), transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(153,143,199,0.4), transparent 70%)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                Ready to bridge intent and impact?
              </h2>
              <p className="mt-3 text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Create your account, capture your first cleanup, and let AI do the verification.
              </p>
              <div className="mt-6 md:mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => openAuth('signup')}
                  className="px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all hover:-translate-y-0.5"
                  style={{
                    background: '#fff',
                    color: '#14248a',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.22)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'}
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => openAuth('signin')}
                  className="px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PARTNER STRIP — real tech we use */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 md:mt-16 pt-8 border-t flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          style={{ borderColor: '#ebe3ff' }}
        >
          <span
            className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] font-bold w-full md:w-auto text-center md:text-left"
            style={{ color: '#8a8590' }}
          >
            Powered by
          </span>
          {['Google Gemini', 'Firebase', 'MongoDB', 'Cloudinary', 'Vercel'].map((b) => (
            <span key={b} className="text-sm md:text-base font-bold transition-colors hover:text-[#14248a] cursor-default" style={{ color: '#5a5760' }}>
              {b}
            </span>
          ))}
        </motion.div>
      </main>

      {/* AUTH MODAL */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </div>
  );
};

export default Landing;
