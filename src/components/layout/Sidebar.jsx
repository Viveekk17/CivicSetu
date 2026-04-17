import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Rss, Gift, BarChart2,
  Users, MessageSquare, AlertTriangle, Ticket, Info,
  Receipt, X, LogOut
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import BrandLogo from '../common/BrandLogo';

const NAV_ITEMS = [
  { path: '/dashboard',      labelKey: 'nav_dashboard',   icon: LayoutDashboard },
  { path: '/upload',         labelKey: 'nav_upload',      icon: Upload },
  { path: '/feed',           labelKey: null, label: 'Public Feed', icon: Rss },
  { path: '/redeem',         labelKey: 'nav_redeem',      icon: Gift },
  { path: '/analytics',     labelKey: 'nav_analytics',   icon: BarChart2 },
  { path: '/ngos',           labelKey: 'nav_ngos',        icon: Users },
  { path: '/community',     labelKey: 'nav_community',   icon: MessageSquare },
  { path: '/report-issue',  labelKey: 'nav_report_issue',icon: AlertTriangle },
  { path: '/my-tickets',    labelKey: null, label: 'My Tickets', icon: Ticket },
  { path: '/my-transactions', labelKey: null, label: 'My Transactions', icon: Receipt },
  { path: '/about',          labelKey: null, label: 'About Us',  icon: Info },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(40, 38, 44, 0.4)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-light)' }}>
          <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
            <BrandLogo size={36} />
            <h1 className="text-lg font-bold tracking-tight">
              <span style={{ color: '#14248a' }}>CIVIC</span>
              <span style={{ color: '#998fc7' }}>सेतु</span>
            </h1>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const label = item.labelKey ? t[item.labelKey] : item.label;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium"
                style={({ isActive }) => isActive
                  ? { backgroundColor: '#14248a', color: '#ffffff' }
                  : { color: 'var(--text-secondary)', backgroundColor: 'transparent' }
                }
                onMouseEnter={(e) => {
                  const active = e.currentTarget.getAttribute('aria-current') === 'page';
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-lighter)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  const active = e.currentTarget.getAttribute('aria-current') === 'page';
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border-light)' }}>
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white"
            style={{ backgroundColor: '#ef4444' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
