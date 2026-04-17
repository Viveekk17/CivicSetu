import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faCheck,
    faInbox,
    faSeedling,
    faUsers,
    faCoins,
    faUserShield,
    faClipboardList,
    faNewspaper,
    faCircle,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';

const SECTIONS = [
    {
        title: 'Overview',
        items: [
            { path: '/admin/dashboard', name: 'Dashboard', icon: faChartLine },
            { path: '/admin/analytics', name: 'Analytics', icon: faClipboardList },
        ],
    },
    {
        title: 'Operations',
        items: [
            { path: '/admin/requests', name: 'Helpdesk Tickets', icon: faInbox, badge: 'Live' },
            { path: '/admin/submissions', name: 'Verified Subs', icon: faCheck },
            { path: '/admin/tree-requests', name: 'Tree Requests', icon: faSeedling },
        ],
    },
    {
        title: 'Community',
        items: [
            { path: '/admin/feed', name: 'Public Feed', icon: faNewspaper },
            { path: '/admin/communities', name: 'Communities', icon: faUsers },
        ],
    },
    {
        title: 'Manage',
        items: [
            { path: '/admin/users', name: 'Users', icon: faUserShield },
            { path: '/admin/transactions', name: 'Transactions', icon: faCoins },
        ],
    },
];

const SIDEBAR_WIDTH = 256;
const SIDEBAR_MINI = 72;

const AdminSidebar = ({ isDesktop, collapsed, mobileOpen, onMobileClose }) => {
    // Effective width and translation
    let translateX, width, visible;
    if (isDesktop) {
        translateX = 0;
        width = collapsed ? SIDEBAR_MINI : SIDEBAR_WIDTH;
        visible = true;
    } else {
        translateX = mobileOpen ? 0 : -SIDEBAR_WIDTH;
        width = SIDEBAR_WIDTH;
        visible = mobileOpen;
    }

    const isMini = isDesktop && collapsed;

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {!isDesktop && mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] md:hidden backdrop-blur-sm"
                        style={{ background: 'rgba(15,18,28,0.55)' }}
                        onClick={onMobileClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ x: translateX, width }}
                transition={{ type: 'tween', duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`${isDesktop ? 'sticky' : 'fixed'} top-0 left-0 z-[70] h-screen flex flex-col overflow-hidden shrink-0`}
                style={{
                    background: 'var(--a-sidebar)',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                }}
            >
                {/* Brand */}
                <Link
                    to="/admin/dashboard"
                    className="h-16 flex items-center gap-3 shrink-0 px-5 cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <BrandLogo size={36} variant="onDark" />
                    {!isMini && (
                        <div className="leading-tight overflow-hidden">
                            <p className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
                                CivicSetu
                            </p>
                            <p
                                className="text-[10px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
                                style={{ color: '#60A5FA' }}
                            >
                                Admin Console
                            </p>
                        </div>
                    )}
                </Link>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 overflow-y-auto overflow-x-hidden">
                    {SECTIONS.map((section) => (
                        <div key={section.title} className="mb-5">
                            {!isMini && (
                                <p
                                    className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap"
                                    style={{ color: 'rgba(154,163,178,0.55)' }}
                                >
                                    {section.title}
                                </p>
                            )}
                            {isMini && (
                                <div
                                    className="mx-3 mb-2 h-px"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                />
                            )}
                            <ul className="space-y-0.5">
                                {section.items.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={() => {
                                                if (!isDesktop) onMobileClose();
                                            }}
                                            title={isMini ? item.name : undefined}
                                            className="relative flex items-center justify-between rounded-lg group transition-colors duration-150"
                                            style={({ isActive }) => ({
                                                background: isActive ? 'var(--a-sidebar-active-bg)' : 'transparent',
                                                color: isActive ? '#FFFFFF' : 'var(--a-sidebar-text)',
                                                padding: isMini ? '10px' : '8px 12px',
                                                justifyContent: isMini ? 'center' : 'space-between',
                                            })}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive && (
                                                        <span
                                                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                                                            style={{ background: 'var(--a-sidebar-active-bar)' }}
                                                        />
                                                    )}
                                                    <span className={`flex items-center ${isMini ? '' : 'gap-3 min-w-0'}`}>
                                                        <FontAwesomeIcon
                                                            icon={item.icon}
                                                            className="w-4 text-[13px] shrink-0"
                                                            style={{
                                                                color: isActive ? '#93C5FD' : 'rgba(154,163,178,0.85)',
                                                            }}
                                                        />
                                                        {!isMini && (
                                                            <span
                                                                className="text-[13px] font-medium tracking-tight truncate"
                                                                style={{
                                                                    color: isActive ? '#FFFFFF' : 'var(--a-sidebar-text)',
                                                                }}
                                                            >
                                                                {item.name}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {!isMini && item.badge && (
                                                        <span
                                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                                                            style={{
                                                                background: isActive
                                                                    ? 'rgba(255,255,255,0.14)'
                                                                    : 'rgba(96,165,250,0.18)',
                                                                color: isActive ? '#fff' : '#93C5FD',
                                                                letterSpacing: '0.06em',
                                                                textTransform: 'uppercase',
                                                            }}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer status */}
                <div
                    className={`shrink-0 ${isMini ? 'p-2' : 'p-3'}`}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div
                        className={`rounded-xl flex items-center ${isMini ? 'justify-center p-2' : 'gap-3 p-3'}`}
                        style={{ background: 'var(--a-sidebar-2)' }}
                        title={isMini ? 'All systems operational' : undefined}
                    >
                        <div
                            className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(5,150,105,0.14)' }}
                        >
                            <FontAwesomeIcon icon={faCircle} className="text-[8px]" style={{ color: '#10B981' }} />
                            <span
                                className="absolute inset-0 rounded-lg animate-ping"
                                style={{ background: 'rgba(16,185,129,0.18)' }}
                            />
                        </div>
                        {!isMini && (
                            <div className="leading-tight min-w-0">
                                <p className="text-[11px] font-bold text-white whitespace-nowrap">
                                    All Systems Operational
                                </p>
                                <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--a-sidebar-text)' }}>
                                    Last check: just now
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default AdminSidebar;
