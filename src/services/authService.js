import api from './api';

import { auth, googleProvider } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';

// Register new user (Firebase -> Backend Sync)
export const searchUsers = async (query) => {
  return await api.get(`/users/search?query=${query}`);
};

export const register = async (userData) => {
  try {
    const { email, password, name } = userData;
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update profile (name)
    await updateProfile(user, { displayName: name });

    // 3. Get ID Token
    const token = await user.getIdToken();

    // 4. Sync with Backend
    const response = await api.post('/auth/firebase', { token });

    // Store token and user data
    if (response.success) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

// Login user (Firebase -> Backend Sync)
export const login = async (credentials) => {
  try {
    const { email, password } = credentials;
    // 1. Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Get ID Token
    const token = await user.getIdToken();

    // 3. Sync with Backend
    const response = await api.post('/auth/firebase', { token });

    // Store token and user data
    if (response.success) {
      console.log('✅ Login successful, storing token and user data');
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
      console.log('User:', response.data.user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Verify storage immediately
      const storedToken = localStorage.getItem('token');
      console.log('✅ Verified token is in localStorage:', !!storedToken);
    }

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

// Google Login
export const googleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();

    const response = await api.post('/auth/firebase', { token });

    if (response.success) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// Get current user
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get stored user data
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Refresh user profile from backend
export const refreshUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    if (response.success) {
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      // Dispatch event to update components listening to changes (like Header)
      window.dispatchEvent(new CustomEvent('creditsUpdated', {
        detail: { credits: user.credits }
      }));
      return user;
    }
  } catch (error) {
    console.error('Failed to refresh user profile:', error);
  }
  return null;
};
