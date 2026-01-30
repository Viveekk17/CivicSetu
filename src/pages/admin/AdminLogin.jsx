import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faLock, faIdCard, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { login } from '../../services/authService';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await login(formData);

            if (response.success) {
                // Check for admin privileges
                // In a real app, we should check claim or fetch user profile
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    setError('Access Denied: You do not have administrator privileges.');
                    // Clear session if not admin
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}>
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-2xl relative z-10"
            >
                <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>

                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex justify-center">
                        <img src="/logo.png" alt="CivicSetu" className="h-20 object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-bold mb-1">
                        <span style={{ color: '#3b82f6' }}>CIVIC</span><span style={{ color: '#10b981' }}>सेतु</span>
                    </h2>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Portal</h1>
                    <p className="text-gray-500">Authorized Government Personnel Only</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Officer Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400">
                                <FontAwesomeIcon icon={faIdCard} />
                            </span>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
                                placeholder="admin@ecotrace.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Secure Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400">
                                <FontAwesomeIcon icon={faLock} />
                            </span>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>Login to System</>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    <p>Restricted Access System v2.4.0</p>
                    <p>Unauthorized access is a punishable offense.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
