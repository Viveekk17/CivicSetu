import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSignOutAlt,
    faBars,
    faChevronDown,
    faBell,
    faSearch,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/layout/AdminSidebar';

const PAGE_LABELS = {
    'dashboard': 'Overview',
    'feed': 'Public Feed',
    'submission-reviews': 'Action Reviews',
    'submissions': 'Verified Submissions',
    'requests': 'Helpdesk Tickets',
    'tree-requests': 'Tree Requests',
    'communities': 'Communities',
    'transactions': 'Transactions',
    'users': 'Users',
    'analytics': 'Analytics',
    'settings': 'Settings',
};

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    // Mobile drawer open state (off-canvas under md)
    const [mobileOpen, setMobileOpen] = useState(false);
    // Desktop collapsed state (mini rail at md and up)
    const [collapsed, setCollapsed] = useState(false);
    const [isDesktop, setIsDesktop] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 : true
    );

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    useEffect(() => {
        const onResize = () => {
            const d = window.innerWidth >= 768;
            setIsDesktop(d);
            if (d) setMobileOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    const handleHamburger = () => {
        if (isDesktop) setCollapsed((c) => !c);
        else setMobileOpen((o) => !o);
    };

    const segments = location.pathname.split('/').filter(Boolean);
    const activeKey = segments[1] || 'dashboard';
    const activeLabel = PAGE_LABELS[activeKey] || 'Overview';

    return (
        <div className="admin-portal min-h-screen flex">
            <AdminSidebar
                isDesktop={isDesktop}
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Topbar */}
                <header
                    className="h-16 sticky top-0 z-40 flex items-center px-4 sm:px-6 lg:px-8"
                    style={{
                        background: 'var(--a-surface)',
                        borderBottom: '1px solid var(--a-border)',
                    }}
                >
                    <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                        {/* Left: hamburger + breadcrumb */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={handleHamburger}
                                className="a-btn a-btn-ghost a-btn-icon"
                                aria-label="Toggle sidebar"
                            >
                                <FontAwesomeIcon icon={faBars} />
                            </button>
                            <nav className="hidden sm:flex items-center gap-2 text-sm min-w-0">
                                <span style={{ color: 'var(--a-text-3)' }}>Admin</span>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="text-[10px]"
                                    style={{ color: 'var(--a-text-3)' }}
                                />
                                <span
                                    className="font-semibold truncate"
                                    style={{ color: 'var(--a-text-1)' }}
                                >
                                    {activeLabel}
                                </span>
                            </nav>
                        </div>

                        {/* Center: search */}
                        <div className="hidden lg:flex items-center flex-1 max-w-md">
                            <div className="relative w-full">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                                    style={{ color: 'var(--a-text-3)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search submissions, users, tickets"
                                    className="a-input a-input-search"
                                />
                            </div>
                        </div>

                        {/* Right: notifications + profile */}
                        <div className="flex items-center gap-2">
                            <button
                                className="a-btn a-btn-ghost a-btn-icon relative"
                                aria-label="Notifications"
                            >
                                <FontAwesomeIcon icon={faBell} />
                                <span
                                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                                    style={{ background: 'var(--a-danger)' }}
                                />
                            </button>

                            <div
                                className="h-6 w-px mx-1 hidden sm:block"
                                style={{ background: 'var(--a-border)' }}
                            />

                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors"
                                    style={{
                                        background: profileOpen ? 'var(--a-surface-2)' : 'transparent',
                                    }}
                                >
                                    <div className="a-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="hidden sm:block text-left leading-tight">
                                        <p
                                            className="text-xs font-semibold truncate max-w-[140px]"
                                            style={{ color: 'var(--a-text-1)' }}
                                        >
                                            {user?.name || 'Admin'}
                                        </p>
                                        <p
                                            className="text-[10px] uppercase tracking-wider font-semibold"
                                            style={{ color: 'var(--a-text-3)' }}
                                        >
                                            {user?.role || 'Administrator'}
                                        </p>
                                    </div>
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        className={`text-[10px] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                                        style={{ color: 'var(--a-text-3)' }}
                                    />
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-60 z-50 a-card a-card-flush"
                                            style={{ boxShadow: 'var(--a-shadow-lg)' }}
                                        >
                                            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--a-border)' }}>
                                                <p className="a-eyebrow mb-1">Account</p>
                                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--a-text-1)' }}>
                                                    {user?.name || 'Admin'}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: 'var(--a-text-2)' }}>
                                                    {user?.email || 'admin@civicsetu.org'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
                                                style={{ color: 'var(--a-danger)' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--a-danger-soft)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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

                {/* Workspace */}
                <main
                    className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
                    style={{ background: 'var(--a-bg)' }}
                >
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-[1400px] mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
