import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCamera,
  faTree,
  faList,
  faChartLine,
  faHandHoldingHeart,
  faUsers,
  faLink,
  faSignOutAlt,
  faLeaf,
  faBars,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const menuItems = [
    { path: '/', name: t.nav_dashboard, badge: null },
    { path: '/upload', name: t.nav_upload, badge: null },
    { path: '/redeem', name: t.nav_redeem, badge: 'HOT' },
    { path: '/submissions', name: t.nav_submissions, badge: null },
    { path: '/analytics', name: t.nav_analytics, badge: null },
    { path: '/ngos', name: t.nav_ngos, badge: null },
    { path: '/community', name: t.nav_community, badge: null },
    { path: '/report-issue', name: t.nav_report_issue, badge: null },
  ];

  // No more profile functions needed in sidebar

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Hidden by default, toggle with hamburger */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-all duration-300 ease-in-out flex flex-col glass border-r border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Hamburger Menu + Logo */}
        <div className="p-6 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight title-gradient">CivicSetu</h1>
        </div>

        {/* Navigation - Text Only */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 768) onClose() }}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative
              `}
              style={({ isActive }) => isActive ? {
                background: 'var(--gradient-primary)',
                color: '#fff'
              } : {
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-lighter)';
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span className="font-medium text-base">{item.name}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full"
                  style={{ background: '#FEF3C7', color: '#D97706' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      </motion.aside>
    </>
  );
};

export default Sidebar;
