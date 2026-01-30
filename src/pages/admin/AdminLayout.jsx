import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faList,
    faClipboardList,
    faCog,
    faSignOutAlt,
    faUserShield,
    faBell,
    faCheck,
    faSearch,
    faUsers,
    faGift,
    faCoins,
    faChevronDown,
    faSeedling
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);

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

    const menuItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: faChartLine },
        { path: '/admin/feed', name: 'Public Feed', icon: faList }, // Using faList or maybe faNewspaper would be better? I will import faNewspaper.
        { path: '/admin/submissions', name: 'Submissions', icon: faCheck },
        { path: '/admin/requests', name: 'Reports', icon: faList }, // Reports used faList. I should use unique icons if possible.
        { path: '/admin/tree-requests', name: 'Tree Requests', icon: faSeedling },
        { path: '/admin/communities', name: 'Communities', icon: faUsers },
        { path: '/admin/transactions', name: 'Transactions', icon: faCoins },
        { path: '/admin/users', name: 'Users', icon: faUserShield },
        { path: '/admin/analytics', name: 'Analytics', icon: faClipboardList },
    ];

    // Theme Colors
    // Primary: Navy Blue #1F3C88
    // Background: Light Grey #F4F6F9
    // Accent: Teal #00A8A8
    // Text: Dark Charcoal #2E2E2E

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col">
            {/* Header / Navigation Bar */}
            <header className="bg-gradient-to-r from-white via-blue-50 to-[#1F3C88] text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo & Brand */}
                        <div className="flex items-center gap-3">
                            <img src="/civicsetu-logo.png" alt="CivicSetu Logo" className="h-12 w-auto" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl tracking-tight leading-tight text-gray-800">CivicSetu</span>
                                <span className="text-xs text-gray-600 font-medium">Admin Portal</span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                                        ${isActive
                                            ? 'bg-[#00A8A8] text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                                    `}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>

                        {/* User Profile & Actions */}
                        <div className="flex items-center gap-4">
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-3 focus:outline-none hover:bg-white/5 px-3 py-2 rounded-lg transition"
                                >
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white leading-tight">
                                            {user?.name || 'Admin Officer'}
                                        </p>
                                        <p className="text-xs text-[#00A8A8] font-medium tracking-wide">
                                            {user?.role === 'admin' ? 'Super Admin' : 'Officer'}
                                        </p>
                                    </div>
                                    <span className={`text-xs text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 text-gray-800 z-50 border border-gray-100"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100 mb-2">
                                                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden bg-[#162d66] px-2 py-2 flex flex-wrap gap-2 justify-center">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                 px-3 py-1 rounded text-xs text-white
                                 ${isActive ? 'bg-[#00A8A8]' : 'bg-white/5'}
                             `}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
};

export default AdminLayout;
