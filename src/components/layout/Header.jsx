import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSun, faMoon, faBell, faCoins, faCheckCircle, faTrash, faTimes, faSignOutAlt, faShoppingBag, faGift, faBus, faBolt } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';
import { getStoredUser } from '../../services/authService';
import { getInventory, useItem } from '../../services/treeService';

const Header = ({ onMenuClick, isSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [usingItem, setUsingItem] = useState(null);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const bagRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (bagRef.current && !bagRef.current.contains(event.target)) {
        setShowBag(false);
      }
    };

    if (showNotifications || showUserMenu || showBag) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu, showBag]);

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      const response = await getInventory();
      if (response.success) {
        setInventory(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user?.credits]); // Refetch when credits change (likely due to redemption/upload)

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

      // Refresh inventory too
      fetchInventory();
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

  const handleUseItem = async (itemId, itemName) => {
    try {
      setUsingItem(itemId);
      const response = await useItem(itemId);

      if (response.success) {
        // Update local inventory state
        setInventory(response.data);

        // Add success notification
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Item Used',
          message: `Successfully used ${itemName}`,
          timestamp: new Date().toISOString(),
          read: false
        });

        // Dispatch event to refresh activity feed if needed
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: {} }));
      }
    } catch (err) {
      console.error('Failed to use item:', err);
      addNotification({
        id: Date.now(),
        type: 'error',
        title: 'Error',
        message: 'Failed to use item',
        timestamp: new Date().toISOString(),
        read: false
      });
    } finally {
      setUsingItem(null);
    }
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
        {/* Hamburger Menu Button - Only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
        )}

        {/* Page Title & Logo */}
        <div className="hidden md:flex items-center gap-3">
          <img src="/logo.png" alt="CivicSetu Logo" className="h-16 w-auto object-contain" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              <span className="title-gradient">CivicSetu</span>
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Turning Civic Effort into Citizen Value</p>
          </div>
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



        {/* Inventory Bag */}
        <div className="relative" ref={bagRef}>
          <button
            onClick={() => setShowBag(!showBag)}
            className="p-3 rounded-full relative transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon icon={faShoppingBag} />
            {inventory.length > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {inventory.length}
              </span>
            )}
          </button>

          {/* Bag Dropdown */}
          {showBag && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl overflow-hidden z-30"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                maxHeight: '400px'
              }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>My Bag</h3>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{inventory.length} items</span>
              </div>

              <div className="overflow-y-auto p-2" style={{ maxHeight: '320px' }}>
                {inventory.length === 0 ? (
                  <div className="p-8 text-center">
                    <FontAwesomeIcon icon={faShoppingBag} className="text-4xl mb-3 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your bag is empty</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Redeem items to see them here</p>
                  </div>
                ) : (
                  inventory.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 mb-2 rounded-lg border flex items-center gap-3 transition-colors hover:bg-opacity-50"
                      style={{
                        borderColor: 'var(--border-light)',
                        backgroundColor: 'var(--bg-body)'
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.category === 'transport' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        item.category === 'utilities' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                        }`}>
                        <FontAwesomeIcon
                          icon={
                            item.category === 'transport' ? faBus :
                              item.category === 'utilities' ? faBolt :
                                faGift
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {item.category}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUseItem(item._id, item.name)}
                        disabled={usingItem === item._id}
                        className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
                        style={{
                          background: 'var(--gradient-primary)',
                          opacity: usingItem === item._id ? 0.7 : 1
                        }}
                      >
                        {usingItem === item._id ? '...' : 'Use'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
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
                            className={`text-sm ${notif.type === 'success' ? 'text-green-600 dark:text-green-400' :
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

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 rounded-full flex items-center gap-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="User menu"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <span>{getInitials(user?.name)}</span>
            </div>
            <span className="hidden md:block font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'User'}
            </span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)'
              }}
            >
              {/* User Info */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <span>{getInitials(user?.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {user?.name || 'Guest User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {getRole(user?.credits || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {user?.credits?.toLocaleString() || 0} Credits
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all"
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#ef4444'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Helper functions
const getInitials = (name) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const getRole = (credits) => {
  if (credits >= 10000) return 'Eco Champion 🏆';
  if (credits >= 5000) return 'Eco Hero 🌟';
  if (credits >= 1000) return 'Eco Warrior ⚔️';
  return 'Eco Beginner 🌱';
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
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
