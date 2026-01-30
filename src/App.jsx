import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import BaseLayout from './components/layout/BaseLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Redeem from './pages/Redeem';
import Submissions from './pages/Submissions';
import Analytics from './pages/Analytics';
import Placeholder from './pages/Placeholder';
import NGODashboard from './pages/NGODashboard';
import Community from './pages/Community';
import ReportIssue from './pages/ReportIssue';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminTreeRequests from './pages/admin/AdminTreeRequests';
import AdminFeed from './pages/admin/AdminFeed';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCommunities from './pages/admin/AdminCommunities';
import AdminTransactions from './pages/admin/AdminTransactions';
import PublicFeed from './pages/PublicFeed';

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <LanguageProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="tree-requests" element={<AdminTreeRequests />} />
          <Route path="feed" element={<AdminFeed />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="communities" element={<AdminCommunities />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings Page Placeholder</div>} />
        </Route>

        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="redeem" element={<Redeem />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="feed" element={<PublicFeed />} />
          <Route path="ngos" element={<NGODashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="report-issue" element={<ReportIssue />} />
          <Route path="blockchain" element={
            <Placeholder
              title="Blockchain"
              message="Not available for now ."
            />
          } />
        </Route>
      </Routes>
    </LanguageProvider>
  );
};

export default App;
