import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSun, faMoon, faBell, faCoins, faCheckCircle, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { getStoredUser } from '../../services/authService';

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Listen for credit updates and notifications
  useEffect(() => {
    const handleCreditsUpdate = (event) => {
      // Refresh user from localStorage
      const updatedUser = getStoredUser();
      setUser(updatedUser);
      
      // Add notification for credits earned
      if (event.detail && event.detail.credits) {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Credits Earned!',
          message: `You earned ${event.detail.credits} credits from your submission.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    };

    const handleNewNotification = (event) => {
      if (event.detail) {
        addNotification({
          id: Date.now(),
          ...event.detail,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    window.addEventListener('newNotification', handleNewNotification);

    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 20)); // Keep only last 20
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 rounded-full relative transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                maxHeight: '400px'
              }}
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <FontAwesomeIcon icon={faBell} className="text-4xl mb-3 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b transition-colors hover:bg-opacity-50 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                      style={{ borderColor: 'var(--border-light)' }}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                          notif.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          notif.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <FontAwesomeIcon 
                            icon={
                              notif.type === 'success' ? faCheckCircle :
                              notif.type === 'error' ? faTimes :
                              faBell
                            }
                            className={`text-sm ${
                              notif.type === 'success' ? 'text-green-600 dark:text-green-400' :
                              notif.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                              notif.type === 'error' ? 'text-red-600 dark:text-red-400' :
                              'text-blue-600 dark:text-blue-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {notif.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {notif.message}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {formatTime(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Helper function to format time
const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
};

export default Header;
