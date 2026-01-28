import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BaseLayout from './components/layout/BaseLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Redeem from './pages/Redeem';
import Submissions from './pages/Submissions';
import Analytics from './pages/Analytics';
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
        <Route path="analytics" element={<Analytics />} />
        <Route path="ngos" element={
          <Placeholder
            title="NGO Dashboard"
            message="You will be seeing all the ngos registered on our platform - competing or contributing for making our Nation Green and Clean."
          />
        } />
        <Route path="community" element={
          <Placeholder
            title="Community"
            message="Create a community here and add a big cleanup activity here (All the activities mentioning over 200kg of waste collection and cleaning will be rewarded by the State Government."
          />
        } />
        <Route path="blockchain" element={
          <Placeholder
            title="Blockchain"
            message="Not available for now ."
          />
        } />
      </Route>
    </Routes>
  );
};

export default App;
