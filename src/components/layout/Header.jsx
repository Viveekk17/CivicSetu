import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, Bell, Coins, CheckCircle, Trash2, X, LogOut,
  ShoppingBag, Gift, Bus, Zap, Newspaper, ChevronDown,
  User, TreePine, Clock, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../services/authService';
import { getInventory, useItem } from '../../services/treeService';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';

const Header = ({ onMenuClick, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const [user, setUser] = useState(getStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [showTreeHistory, setShowTreeHistory] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [usingItem, setUsingItem] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const bagRef = useRef(null);
  const treeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
      if (bagRef.current && !bagRef.current.contains(event.target)) setShowBag(false);
      if (treeDropdownRef.current && !treeDropdownRef.current.contains(event.target)) setShowTreeHistory(false);
    };
    if (showNotifications || showUserMenu || showBag || showTreeHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showUserMenu, showBag, showTreeHistory]);

  const fetchInventory = async () => {
    try {
      const response = await getInventory();
      if (response.success) setInventory(response.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  useEffect(() => { if (user) fetchInventory(); }, [user?.credits]);

  useEffect(() => {
    const handleCreditsUpdate = (event) => {
      const updatedUser = getStoredUser();
      setUser(updatedUser);
      if (event.detail && event.detail.credits) {
        addNotification({ id: Date.now(), type: 'success', title: 'Credits Earned', message: `You earned ${event.detail.credits} credits from your submission.`, timestamp: new Date().toISOString(), read: false });
      }
      fetchInventory();
    };
    const handleNewNotification = (event) => {
      if (event.detail) addNotification({ id: Date.now(), ...event.detail, timestamp: new Date().toISOString(), read: false });
    };
    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    window.addEventListener('newNotification', handleNewNotification);
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  useEffect(() => { if (notifications.length > 0) localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);

  const addNotification = (n) => setNotifications(prev => [n, ...prev].slice(0, 20));
  const markAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAllNotifications = () => { setNotifications([]); localStorage.removeItem('notifications'); };

  const handleUseItem = async (itemId, itemName) => {
    try {
      setUsingItem(itemId);
      const response = await useItem(itemId);
      if (response.success) {
        setInventory(response.data);
        addNotification({ id: Date.now(), type: 'success', title: 'Item Used', message: `Successfully used ${itemName}`, timestamp: new Date().toISOString(), read: false });
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: {} }));
      }
    } catch (err) {
      addNotification({ id: Date.now(), type: 'error', title: 'Error', message: 'Failed to use item', timestamp: new Date().toISOString(), read: false });
    } finally {
      setUsingItem(null);
    }
  };

  const fetchRedemptions = async () => {
    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/trees/my-redemptions`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setRedemptions(response.data.data);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoadingRedemptions(false);
    }
  };

  useEffect(() => { if (showTreeHistory && user) fetchRedemptions(); }, [showTreeHistory]);

  const getStatusBadge = (status) => {
    const cfg = {
      pending:              { label: 'Pending',             color: '#92400e', bg: '#fef3c7' },
      sent_to_ngo:          { label: 'Sent to NGO',         color: '#14248a', bg: '#f9f5ff' },
      planting_in_process:  { label: 'Planting in Progress',color: '#14248a', bg: '#ebe3ff' },
      completed:            { label: 'Completed',           color: '#065f46', bg: '#d1fae5' },
    };
    const c = cfg[status] || cfg.pending;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  /* ---- render helpers ---- */
  const iconBtn = 'relative p-2.5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary';
  const iconBtnStyle = { color: 'var(--text-secondary)', backgroundColor: 'transparent' };
  const iconBtnHover = (e) => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)';
  const iconBtnLeave = (e) => e.currentTarget.style.backgroundColor = 'transparent';

  return (
    <header
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button onClick={onMenuClick} className={iconBtn} style={iconBtnStyle} onMouseEnter={iconBtnHover} onMouseLeave={iconBtnLeave} aria-label="Open menu">
            <Menu size={18} />
          </button>
        )}
        <div className="hidden md:flex items-center gap-2.5">
          <img src="/logo.png" alt="CivicSetu Logo" className="h-9 w-auto object-contain" />
          <div>
            <h2 className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              <span style={{ color: '#14248a' }}>CIVIC</span><span style={{ color: '#998fc7' }}>सेतु</span>
            </h2>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>स्वच्छ भारत अपना भारत</p>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">

        {/* Credits */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg mr-1"
          style={{ backgroundColor: 'var(--primary-lighter)', border: '1px solid var(--border-medium)' }}>
          <Coins size={14} style={{ color: '#d97706' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user?.credits?.toLocaleString() || 0}</span>
        </div>

        {/* Trees Planted */}
        <div className="relative" ref={treeDropdownRef}>
          <button
            onClick={() => setShowTreeHistory(!showTreeHistory)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg mr-1 transition-colors"
            style={{ backgroundColor: 'var(--primary-lighter)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
          >
            <TreePine size={14} style={{ color: '#14248a' }} />
            <span className="text-sm font-bold">{user?.impact?.treesPlanted?.toLocaleString() || 0}</span>
            <ChevronDown size={12} style={{ color: 'var(--text-tertiary)', transform: showTreeHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          {showTreeHistory && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)' }}>
              <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-light)' }}>
                <TreePine size={16} style={{ color: '#14248a' }} />
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tree Redemption History</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingRedemptions ? (
                  <div className="p-8 text-center">
                    <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                  </div>
                ) : redemptions.length === 0 ? (
                  <div className="p-8 text-center">
                    <TreePine size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No tree redemptions yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                    {redemptions.map((r) => (
                      <div key={r._id} className="p-4 transition-colors" style={{ borderColor: 'var(--border-light)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'var(--border-light)' }}>
                                <TreePine size={14} style={{ color: '#14248a' }} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                  {r.treesRequested} {r.treesRequested === 1 ? 'Tree' : 'Trees'}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.itemName}</p>
                              </div>
                            </div>
                            <div className="mt-2">{getStatusBadge(r.status)}</div>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                              {r.status === 'completed' && r.completedAt
                                ? `Completed: ${new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : `Requested: ${new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            </p>
                          </div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{r.creditsSpent} credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-colors mr-1"
          style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-body)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
        >
          {language === 'en' ? 'EN' : 'HI'}
        </button>

        {/* Inventory Bag */}
        <div className="relative" ref={bagRef}>
          <button onClick={() => setShowBag(!showBag)} className={iconBtn} style={iconBtnStyle} onMouseEnter={iconBtnHover} onMouseLeave={iconBtnLeave}>
            <ShoppingBag size={18} />
            {inventory.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: '#14248a' }}>{inventory.length}</span>
            )}
          </button>

          {showBag && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-30"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)', maxHeight: '400px' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>My Bag</h3>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{inventory.length} items</span>
              </div>
              <div className="overflow-y-auto p-2" style={{ maxHeight: '320px' }}>
                {inventory.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingBag size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your bag is empty</p>
                  </div>
                ) : (
                  inventory.map((item) => (
                    <div key={item._id} className="p-3 mb-1.5 rounded-lg border flex items-center gap-3"
                      style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-body)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--primary-lighter)' }}>
                        {item.category === 'transport' ? <Bus size={15} style={{ color: '#14248a' }} /> :
                          item.category === 'utilities' ? <Zap size={15} style={{ color: '#14248a' }} /> :
                            <Gift size={15} style={{ color: '#14248a' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{item.category}</p>
                      </div>
                      <button
                        onClick={() => handleUseItem(item._id, item.name)}
                        disabled={usingItem === item._id}
                        className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all"
                        style={{ backgroundColor: '#14248a', opacity: usingItem === item._id ? 0.6 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0e1a66'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14248a'}
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
          <button onClick={() => setShowNotifications(!showNotifications)} className={iconBtn} style={iconBtnStyle} onMouseEnter={iconBtnHover} onMouseLeave={iconBtnLeave}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)', maxHeight: '400px' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifications} className="text-xs font-semibold text-red-500 hover:text-red-600">Clear All</button>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id}
                      className="p-4 border-b transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--border-light)', backgroundColor: !notif.read ? 'var(--primary-lighter)' : 'transparent' }}
                      onClick={() => markAsRead(notif.id)}>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: notif.type === 'success' ? '#d1fae5' : notif.type === 'error' ? '#fee2e2' : '#ebe3ff' }}>
                          {notif.type === 'success' ? <CheckCircle size={13} style={{ color: '#065f46' }} /> :
                            notif.type === 'error' ? <AlertCircle size={13} style={{ color: '#dc2626' }} /> :
                              <Bell size={13} style={{ color: '#14248a' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{notif.title}</h4>
                            <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                          <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                            <Clock size={10} />{formatTime(notif.timestamp)}
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

        {/* User Menu */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={iconBtnHover} onMouseLeave={iconBtnLeave}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden"
              style={{ backgroundColor: '#14248a' }}>
              {(user?.profilePicture && !user.profilePicture.includes('default-avatar.png'))
                ? <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                : <span style={{ fontSize: '0.75rem' }}>{getInitials(user?.name)}</span>}
            </div>
            <span className="hidden md:block font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
            <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)' }}>
              {/* User info */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#14248a' }}>
                    {(user?.profilePicture && !user.profilePicture.includes('default-avatar.png'))
                      ? <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      : <span style={{ fontSize: '0.8rem' }}>{getInitials(user?.name)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Guest User'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{getRole(user?.credits || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Coins size={13} style={{ color: '#d97706' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.credits?.toLocaleString() || 0} Credits</span>
                </div>
              </div>

              {/* Profile link */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <Link to="/profile" onClick={() => setShowUserMenu(false)}
                  className="w-full p-2.5 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: 'var(--text-primary)', backgroundColor: 'var(--primary-lighter)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-medium)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}>
                  <User size={14} />
                  My Profile
                </Link>
              </div>

              {/* Quick links */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'My Posts', icon: Newspaper, href: '/feed?myPosts=true' },
                    { label: 'Submissions', icon: CheckCircle, href: '/submissions' },
                  ].map(({ label, icon: Icon, href }) => (
                    <button key={label} onClick={() => { window.location.href = href; setShowUserMenu(false); }}
                      className="p-2 flex items-center gap-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className="p-2">
                <button onClick={handleLogout}
                  className="w-full p-2.5 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-colors text-white"
                  style={{ backgroundColor: '#ef4444' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}>
                  <LogOut size={14} />
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

// Helpers
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRole = (credits) => {
  if (credits >= 10000) return 'Civic Champion';
  if (credits >= 5000) return 'Civic Hero';
  if (credits >= 1000) return 'Civic Warrior';
  return 'Civic Beginner';
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const formatTime = (timestamp) => {
  const diffMs = new Date() - new Date(timestamp);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default Header;
