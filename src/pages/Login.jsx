import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faEnvelope, faLock, faArrowRight, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import { login, googleLogin, setupRecaptcha, sendOtp, verifyOtp, completePhoneSignup } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null); // Ref to store reCAPTCHA verifier

  // Email Login State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Phone Login State
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91 '); // Default to India
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [username, setUsername] = useState('');
  const [tempToken, setTempToken] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Don't clear error here - let it persist until next submission
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Initialize reCAPTCHA only if not already done
      if (!recaptchaRef.current) {
        recaptchaRef.current = setupRecaptcha(phoneNumber);
      }
      const appVerifier = recaptchaRef.current;
      const confirmation = await sendOtp(phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError(err.message || "Failed to send OTP");
      // If error occurs, we might want to reset the catpcha to allow retry
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
          // Clear the container manually if needed
          const container = document.getElementById('recaptcha-container');
          if (container) container.innerHTML = '';
        } catch (clearErr) {
          console.error("Failed to clear captcha", clearErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await verifyOtp(confirmationResult, otp);
      if (response.success) {
        if (response.isNewUser) {
          setIsNewUser(true);
          setTempToken(response.token);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await completePhoneSignup(tempToken, username);
      if (response.success) {
        navigate('/');
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || "Failed to complete signup");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Extra safety to prevent event bubbling

    setLoading(true);
    setError('');

    try {
      const response = await login(formData);

      if (response.success) {
        // Success! Navigate to dashboard
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err); // Log for debugging
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await googleLogin();
      // Auth service already sets token/user in localStorage
      if (response && response.success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Google Login error:', err);
      setError(err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-body)' }}>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--primary)' }}></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--secondary)' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 p-8 card glass border-t border-white border-opacity-50 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">
            <img src="/logo.png" alt="CivicSetu" className="h-24 object-contain drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {isNewUser ? (
              "Welcome!"
            ) : (
              <>
                Welcome to <span style={{ color: '#3b82f6' }}>CIVIC</span><span style={{ color: '#10b981' }}>सेतु</span>
              </>
            )}
          </h2>
          <p className="font-bold text-lg" style={{ color: '#000000' }}>
            {isNewUser ? "Please set a username to continue" : "स्वच्छ भारत अपना भारत"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Login Method Tabs - Hide if new user setup */}
        {!isNewUser && (
          <div className="flex mb-6 border-b border-gray-200">
            <button
              className={`flex-1 pb-2 text-sm font-bold transition-colors ${!isPhoneLogin ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setIsPhoneLogin(false)}
            >
              Email Login
            </button>
            <button
              className={`flex-1 pb-2 text-sm font-bold transition-colors ${isPhoneLogin ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setIsPhoneLogin(true)}
            >
              Phone Login
            </button>
          </div>
        )}

        {isNewUser ? (
          /* Step 3: Username Setup (For New Users) */
          <form onSubmit={handleCompleteSignup}>
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                Choose Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)' }}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all mb-4 text-white"
              style={{ background: 'var(--gradient-primary)' }}
              disabled={loading}
            >
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Create Account"}
            </button>
          </form>
        ) : !isPhoneLogin ? (
          /* Email Login Form */
          <form onSubmit={handleLogin} className="scale-100 origin-top">
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                {t.login_email}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                {t.login_password}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type="password"
                  name="password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all mb-4 text-white"
              style={{ background: 'var(--gradient-primary)' }}
              disabled={loading}
            >
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : t.login_button}
            </button>
          </form>
        ) : (
          /* Phone Login Form */
          <div className="scale-100 origin-top">
            {!otpSent ? (
              // Step 1: Enter Phone Number
              <form onSubmit={handleSendOtp}>
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FontAwesomeIcon icon={faUserShield} />
                    </span>
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)' }}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-1">Default: India (+91)</p>
                </div>
                <div id="recaptcha-container"></div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all mb-4 text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                  disabled={loading}
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Send OTP"}
                </button>
              </form>
            ) : (
              // Step 2: Enter OTP
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Enter OTP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)' }}
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all mb-4 text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                  disabled={loading}
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 mt-2"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-gray-500 bg-white" style={{ backgroundColor: 'var(--bg-surface)' }}>{t.login_or_continue_with}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 rounded-xl font-bold border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2 mb-6"
          disabled={loading}
          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-body)' }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          {t.login_google}
        </button>

        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t.login_no_account} {' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: 'var(--primary-color)' }}>
              {t.login_register}
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <Link to="/admin/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">
            <FontAwesomeIcon icon={faUserShield} className="mr-1" />
            Officer Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

