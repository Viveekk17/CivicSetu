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

        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="redeem" element={<Redeem />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ngos" element={<NGODashboard />} />
          <Route path="community" element={<Community />} />
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
