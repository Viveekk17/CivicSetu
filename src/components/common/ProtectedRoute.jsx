import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // User not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the component
  return children;
};

export default ProtectedRoute;
