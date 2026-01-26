import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSun, faMoon, faBell, faCoins } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { getStoredUser } from '../../services/authService';

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getStoredUser());

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdate = (event) => {
      // Refresh user from localStorage
      const updatedUser = getStoredUser();
      setUser(updatedUser);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate);

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    };
  }, []);

  return (
    <header 
      className="sticky top-0 z-20 h-20 flex items-center justify-between px-6 glass"
      style={{ 
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)'
      }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ 
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>

        {/* Page Title */}
        <div className="hidden md:block">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, <span className="title-gradient">{user?.name || 'User'}!</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Here's your environmental impact today.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Credits Badge */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
             style={{ 
               backgroundColor: 'var(--bg-surface)', 
               border: '1px solid var(--border-light)' 
             }}>
          <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{user?.credits?.toLocaleString() || 0} Credits</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full transition-all duration-300 hover:shadow-md relative overflow-hidden group"
          style={{ 
            background: theme === 'light' ? '#F3F4F6' : '#334155',
            color: theme === 'light' ? '#374151' : '#FCD34D'
          }}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <FontAwesomeIcon 
            icon={theme === 'light' ? faMoon : faSun} 
            className="transform transition-transform group-hover:rotate-12" 
          />
        </button>

        {/* Notifications */}
        <button className="p-3 rounded-full relative transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <FontAwesomeIcon icon={faBell} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
