import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faEnvelope, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { login } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Don't clear error here - let it persist until next submission
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
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mb-4">
            <FontAwesomeIcon icon={faLeaf} />
          </div>
          <h1 className="text-3xl font-bold mb-2 title-gradient">Welcome Back</h1>
          <p className="text-gray-500">Sign in to continue your eco-journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Email Address</label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white bg-opacity-50"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</a>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white bg-opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 group transition-all"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Sign In
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
