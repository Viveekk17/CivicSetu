import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BaseLayout from './components/layout/BaseLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Redeem from './pages/Redeem';
import Submissions from './pages/Submissions';
import Placeholder from './pages/Placeholder';

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<BaseLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="redeem" element={<Redeem />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="analytics" element={<Placeholder title="Analytics" />} />
        <Route path="ngos" element={<Placeholder title="NGO Dashboard" />} />
        <Route path="community" element={<Placeholder title="Community" />} />
        <Route path="blockchain" element={<Placeholder title="Blockchain" />} />
      </Route>
    </Routes>
  );
};

export default App;
