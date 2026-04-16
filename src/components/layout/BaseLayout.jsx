import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from '../common/NotificationToast';
import Chatbot from '../widgets/Chatbot';

import { isAuthenticated, refreshUserProfile } from '../../services/authService';

const BaseLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      // Refresh user profile to ensure sync (credits, impact, etc.)
      refreshUserProfile();
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-gray-50 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-body)' }}>
      <NotificationToast />

      {/* Sidebar - Hidden by default, toggle with hamburger */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content - Adjusts for sidebar on desktop */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
      >
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
        <Chatbot />
      </div>
    </div>
  );
};

export default BaseLayout;
