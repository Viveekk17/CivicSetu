import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faList,
    faCheck,
    faInbox,
    faSeedling,
    faUsers,
    faCoins,
    faUserShield,
    faClipboardList,
    faNewspaper
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const AdminSidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: faChartLine },
        { path: '/admin/feed', name: 'Public Feed', icon: faNewspaper },
        { path: '/admin/submission-reviews', name: 'Requests', icon: faInbox, badge: 'New' },
        { path: '/admin/submissions', name: 'Verified Subs', icon: faCheck },
        { path: '/admin/requests', name: 'Reports', icon: faList },
        { path: '/admin/tree-requests', name: 'Tree Requests', icon: faSeedling },
        { path: '/admin/communities', name: 'Communities', icon: faUsers },
        { path: '/admin/transactions', name: 'Transactions', icon: faCoins },
        { path: '/admin/users', name: 'Users', icon: faUserShield },
        { path: '/admin/analytics', name: 'Analytics', icon: faClipboardList },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Sidebar */}
            <motion.aside
                initial={false}
                animate={{ 
                    x: isOpen ? 0 : (window.innerWidth < 768 ? -280 : 0),
                    width: isOpen ? 280 : (window.innerWidth < 768 ? 0 : 280)
                }}
                className={`fixed md:sticky top-0 left-0 z-[70] h-screen bg-white border-r border-gray-100 shadow-xl md:shadow-none overflow-hidden flex flex-col`}
            >
                {/* Logo Section */}
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <img src="/civicsetu-logo.png" alt="Logo" className="h-10 w-auto" />
                    <div>
                        <h2 className="font-bold text-gray-800 tracking-tight leading-none text-lg">CivicSetu</h2>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => { if (window.innerWidth < 768) onClose() }}
                            className={({ isActive }) => `
                                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive 
                                    ? 'bg-[#1F3C88] text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#1F3C88]'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon 
                                    icon={item.icon} 
                                    className={`w-5 ${window.location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-[#1F3C88]'}`} 
                                />
                                <span className="font-bold text-sm">{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${window.location.pathname === item.path ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-gray-50">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">System Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-gray-700">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default AdminSidebar;
