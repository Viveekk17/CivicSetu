import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, ShieldCheck, ArrowRight, Loader2, UserCog } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { login, googleLogin, setupRecaptcha, sendOtp, verifyOtp, completePhoneSignup } from '../services/authService';
import BrandLogo from '../components/common/BrandLogo';

/* ---------- reusable sub-components ---------- */
const Label = ({ children }) => (
  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
    {children}
  </label>
);

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon size={15} style={{ color: 'var(--text-tertiary)' }} />
      </span>
    )}
    <input
      {...props}
      className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 rounded-lg border text-sm font-medium outline-none transition-all`}
      style={{
        backgroundColor: 'var(--bg-body)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-medium)',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#14248a';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,36,138,0.08)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'var(--border-medium)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  </div>
);

const PrimaryBtn = ({ loading, children, ...props }) => (
  <button
    {...props}
    className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
    style={{ backgroundColor: loading ? '#4a5fa8' : '#14248a' }}
    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0e1a66'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = loading ? '#4a5fa8' : '#14248a'; }}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : children}
  </button>
);

const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
    style={{
      color: active ? '#14248a' : 'var(--text-tertiary)',
      borderBottom: active ? '2px solid #14248a' : '2px solid transparent',
    }}
  >
    {children}
  </button>
);

/* ---------- main Login component ---------- */
const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [username, setUsername] = useState('');
  const [tempToken, setTempToken] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (!recaptchaRef.current) recaptchaRef.current = setupRecaptcha(phoneNumber);
      const confirmation = await sendOtp(phoneNumber, recaptchaRef.current);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); recaptchaRef.current = null; const c = document.getElementById('recaptcha-container'); if (c) c.innerHTML = ''; } catch {}
      }
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const response = await verifyOtp(confirmationResult, otp);
      if (response.success) {
        if (response.isNewUser) { setIsNewUser(true); setTempToken(response.token); }
        else navigate('/');
      }
    } catch (err) { setError(err.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const response = await completePhoneSignup(tempToken, username);
      if (response.success) navigate('/');
    } catch (err) { setError(err.message || 'Failed to complete signup'); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); e.stopPropagation(); setLoading(true); setError('');
    try {
      const response = await login(formData);
      if (response.success) navigate('/');
      else setError(response.message || 'Login failed');
    } catch (err) { setError(err.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try {
      const response = await googleLogin();
      if (response && response.success) navigate('/');
    } catch (err) { setError(err.message || 'Google login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-body)' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)' }}>

          {/* Top accent bar */}
          <div className="h-1" style={{ backgroundColor: '#14248a' }} />

          <div className="p-8">
            {/* Logo + title */}
            <div className="text-center mb-7">
              <div className="flex justify-center mb-4"><BrandLogo size={72} /></div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {isNewUser ? 'Create Username' : (
                  <><span style={{ color: '#14248a' }}>CIVIC</span><span style={{ color: '#998fc7' }}>सेतु</span></>
                )}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isNewUser ? 'Choose a username to complete your account' : 'Sign in to continue'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                {error}
              </div>
            )}

            {/* Tabs */}
            {!isNewUser && (
              <div className="flex mb-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <TabBtn active={!isPhoneLogin} onClick={() => setIsPhoneLogin(false)}>Email</TabBtn>
                <TabBtn active={isPhoneLogin} onClick={() => setIsPhoneLogin(true)}>Phone</TabBtn>
              </div>
            )}

            {/* Forms */}
            {isNewUser ? (
              <form onSubmit={handleCompleteSignup} className="space-y-5">
                <div>
                  <Label>Username</Label>
                  <InputField type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" required />
                </div>
                <PrimaryBtn loading={loading} type="submit">
                  Create Account <ArrowRight size={14} />
                </PrimaryBtn>
              </form>

            ) : !isPhoneLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>{t.login_email}</Label>
                  <InputField icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                </div>
                <div>
                  <Label>{t.login_password}</Label>
                  <InputField icon={Lock} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                </div>
                <PrimaryBtn loading={loading} type="submit">
                  {t.login_button} <ArrowRight size={14} />
                </PrimaryBtn>
              </form>

            ) : !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <Label>Phone Number</Label>
                  <InputField icon={Phone} type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" required />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>Default country code: India (+91)</p>
                </div>
                <div id="recaptcha-container" />
                <PrimaryBtn loading={loading} type="submit">
                  Send OTP <ArrowRight size={14} />
                </PrimaryBtn>
              </form>

            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <Label>Enter OTP</Label>
                  <InputField icon={ShieldCheck} type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" required maxLength={6} />
                </div>
                <PrimaryBtn loading={loading} type="submit">
                  Verify OTP <ArrowRight size={14} />
                </PrimaryBtn>
                <button type="button" onClick={() => setOtpSent(false)}
                  className="w-full text-xs font-medium text-center transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                  Change phone number
                </button>
              </form>
            )}

            {/* Divider + Google */}
            {!isNewUser && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: '1px solid var(--border-light)' }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs font-medium" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
                      {t.login_or_continue_with}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors"
                  style={{ border: '1.5px solid var(--border-medium)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; e.currentTarget.style.borderColor = '#998fc7'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-body)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                  {t.login_google}
                </button>
              </>
            )}

            {/* Footer */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
              {t.login_no_account}{' '}
              <Link to="/register" className="font-bold transition-colors" style={{ color: '#14248a' }}
                onMouseEnter={e => e.currentTarget.style.color = '#998fc7'}
                onMouseLeave={e => e.currentTarget.style.color = '#14248a'}>
                {t.login_register}
              </Link>
            </p>

            {/* Admin link */}
            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
              <Link to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <UserCog size={13} />
                Officer Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
