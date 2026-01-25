import React from 'react';
import { NavLink } from 'react-router-dom';
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
  faLeaf
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: faHome },
    { path: '/upload', name: 'Upload Photo', icon: faCamera },
    { path: '/redeem', name: 'Plant Trees', icon: faTree, badge: 'HOT' },
    { path: '/submissions', name: 'My Submissions', icon: faList },
    { path: '/analytics', name: 'Analytics', icon: faChartLine },
    { path: '/ngos', name: 'NGO Dashboard', icon: faHandHoldingHeart },
    { path: '/community', name: 'Community', icon: faUsers },
    { path: '/blockchain', name: 'Blockchain', icon: faLink },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <motion.aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col glass border-r border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderRight: '1px solid rgba(0,0,0,0.05)',
            boxShadow: 'var(--shadow-lg)' 
        }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl shadow-lg"
               style={{ background: 'var(--gradient-primary)' }}>
            <FontAwesomeIcon icon={faLeaf} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight title-gradient">EcoTraceAI</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 768) onClose() }}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
              `}
              style={({ isActive }) => isActive ? { 
                background: 'var(--gradient-primary)',
                color: '#fff'
              } : {
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                // Check if this is the active link by checking aria-current attribute
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-lighter)';
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }
              }}
              onMouseLeave={(e) => {
                // Check if this is the active link by checking aria-current attribute
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span className="absolute right-4 px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-600 rounded-full"
                  style={{ background: '#FEF3C7', color: '#D97706' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Snippet / Bottom Actions */}
        <div className="p-4 border-t border-gray-100 m-4 bg-gray-50 rounded-2xl"
             style={{ backgroundColor: 'var(--bg-body)' }}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
               <span className="font-bold">JD</span>
             </div>
             <div>
               <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>John Doe</p>
               <p className="text-xs text-gray-500">Eco Warrior</p>
             </div>
          </div>
          <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>

      </motion.aside>
    </>
  );
};

export default Sidebar;
