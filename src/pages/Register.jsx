import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faArrowRight, faShieldAlt, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { register, googleLogin, sendEmailOtp, verifyEmailOtp } from '../services/authService';
import BrandLogo from '../components/common/BrandLogo';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // 0: Form, 1: OTP
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await sendEmailOtp(formData.email);
      if (response.success) {
        setStep(1);
        setTimer(60); // 1 minute resend cooldown
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Verify OTP on Backend
      const verifyRes = await verifyEmailOtp(formData.email, otp);
      
      if (!verifyRes.success) {
        setError(verifyRes.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // Step 2: Proceed with actual Firebase Registration
      const response = await register(formData);
      
      if (response.success) {
        navigate('/');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await sendEmailOtp(formData.email);
      setTimer(60);
      setOtp('');
      setError('');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await googleLogin();
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-pulse"
             style={{ background: '#14248a' }}></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl animate-pulse"
             style={{ background: '#998fc7' }}></div>
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogo size={60} />
          </div>
          <h1 className="text-3xl font-black mb-1 text-white tracking-tight">
            <span className="text-blue-400">CIVIC</span>
            <span className="text-emerald-400">सेतु</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">"Building the Bharat of tomorrow"</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.form 
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOTP} 
              className="space-y-4"
            >
              <div className="text-sm font-bold text-emerald-400/80 mb-2 uppercase tracking-widest px-1">Step 01: Your Details</div>
              
              {error && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <div className="relative group">
                  <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Secure Password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 group transition-all mt-6 relative overflow-hidden"
                style={{ background: '#14248a' }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Send Verification Code
                    <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="relative my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-3 transition-all"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-red-400" />
                Sign up with Google
              </button>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already part of the mission?{' '}
                <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyAndRegister} 
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-blue-400 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
                <p className="text-slate-400 text-sm">We've sent a 6-digit code to <br/><span className="text-white font-medium">{formData.email}</span></p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-black tracking-[1em] py-4 rounded-2xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                  placeholder="000000"
                  autoFocus
                />
                
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={timer > 0 || loading}
                    className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors ${
                      timer > 0 ? 'text-slate-600' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faRedo} className={loading ? 'animate-spin' : ''} />
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all"
                style={{ background: '#14248a' }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <button 
                type="button"
                onClick={() => setStep(0)}
                className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors"
              >
                Change Email Address
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
