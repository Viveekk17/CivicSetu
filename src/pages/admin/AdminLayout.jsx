import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSignOutAlt,
    faBars,
    faTimes,
    faChevronDown,
    faBell
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex overflow-hidden">
            {/* Sidebar Component */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Clean Header Bar */}
                <header className="bg-white border-b border-gray-100 h-16 sticky top-0 z-50 flex items-center px-4 sm:px-6 lg:px-8">
                    <div className="flex-1 flex justify-between items-center">
                        
                        {/* Mobile Menu & Search (Left) */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
                            </button>
                            <div className="hidden lg:flex flex-col">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active View</span>
                                <h1 className="text-sm font-extrabold text-[#1F3C88] capitalize">
                                    {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                                </h1>
                            </div>
                        </div>

                        {/* Right Section: Notifications & Profile */}
                        <div className="flex items-center gap-3">
                            <button className="p-2 w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-[#1F3C88] transition-all relative">
                                <FontAwesomeIcon icon={faBell} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block"></div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#1F3C88] text-white flex items-center justify-center font-bold text-sm">
                                        {user?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs font-extrabold text-gray-800 leading-none mb-0.5">
                                            {user?.name || 'Admin Officer'}
                                        </p>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                                            {user?.role || 'Admin'}
                                        </p>
                                    </div>
                                    <FontAwesomeIcon 
                                        icon={faChevronDown} 
                                        className={`text-[10px] text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} 
                                    />
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl shadow-blue-900/10 py-2 text-gray-800 z-[60] border border-gray-100"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Account</p>
                                                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faSignOutAlt} className="text-xs" />
                                                Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
