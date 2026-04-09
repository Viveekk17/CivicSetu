import api from './api';

import { auth, googleProvider } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

// Register new user (Firebase -> Backend Sync)
export const searchUsers = async (query) => {
  return await api.get(`/users/search?query=${query}`);
};

export const register = async (userData) => {
  try {
    const { email, password, name } = userData;

    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Step 2: Update Firebase profile with name
    await updateProfile(firebaseUser, { displayName: name });

    // Step 3: Get Firebase ID Token
    const firebaseToken = await firebaseUser.getIdToken();

    // Step 4: Try to sync with backend
    // Note: api interceptor returns response.data directly, so response IS the data object
    const syncResponse = await api.post('/auth/firebase', { token: firebaseToken });

    if (syncResponse.isNewUser) {
      // Step 5 (new user): Call phone-register to create MongoDB user and get app JWT
      const registerResponse = await api.post('/auth/phone-register', {
        token: firebaseToken,
        name
      });

      if (registerResponse.success) {
        localStorage.setItem('token', registerResponse.data.token);
        localStorage.setItem('user', JSON.stringify(registerResponse.data.user));
      }

      return registerResponse;
    }

    // Existing user — store app token from the sync response
    if (syncResponse.success) {
      localStorage.setItem('token', syncResponse.data.token);
      localStorage.setItem('user', JSON.stringify(syncResponse.data.user));
    }

    return syncResponse;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};



// Admin Login - bypasses Firebase, uses backend JWT directly
export const adminLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);

    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  } catch (error) {
    console.error("Admin Login Error:", error);
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
    // Note: api interceptor returns response.data directly, so response IS the data object
    if (response.success) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data?.user || response.user));
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

// Setup Recaptcha
export const setupRecaptcha = (phoneNumber) => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
      // onSignInSubmit();
      console.log("Recaptcha verified");
    }
  });
  return recaptchaVerifier;
};

// Send OTP
export const sendOtp = async (phoneNumber, appVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// Verify OTP and Login
export const verifyOtp = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    const token = await user.getIdToken();

    const response = await api.post('/auth/firebase', { token });

    if (response.success && !response.isNewUser) {
      localStorage.setItem('token', response.data.token); // Use backend token
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    // Return response even if new user
    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Complete Phone Signup
export const completePhoneSignup = async (token, name) => {
  try {
    const response = await api.post('/auth/phone-register', { token, name });

    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  } catch (error) {
    console.error("Error completing signup:", error);
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
