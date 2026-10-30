import React, { createContext, useContext, useState, useEffect } from 'react';
import safeStorage from '../utils/safeStorage';
import { apiClient, TOKEN_KEY } from '../api/client';
import { toPakServerPhone } from '../utils/phone';

export { toPakServerPhone };
export const AuthContext = createContext(null);

export const AUTH_USER_KEY = '@restaurant_app_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Restore existing session and verify token on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await safeStorage.getItem(TOKEN_KEY);
        const storedUser = await safeStorage.getItem(AUTH_USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify with server in the background
          try {
            const profile = await apiClient('/api/auth/me', { token: storedToken });
            if (profile && profile.user) {
              setUser(profile.user);
              await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile.user));
            }
          } catch (serverErr) {
            // If token expired, clear session
            if (serverErr.status === 401) {
              await safeStorage.removeItem(TOKEN_KEY);
              await safeStorage.removeItem(AUTH_USER_KEY);
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login user via backend API /api/auth/login
   */
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const response = await apiClient('/api/auth/login', {
        method: 'POST',
        body: { email: cleanEmail, password: cleanPass },
      });

      const { token: receivedToken, user: receivedUser } = response;

      setToken(receivedToken);
      setUser(receivedUser);

      // Persist token and user profile in AsyncStorage
      await safeStorage.setItem(TOKEN_KEY, receivedToken);
      await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(receivedUser));

      return receivedUser;
    } catch (error) {
      throw new Error(error.message || 'Login failed. Please verify your credentials.');
    }
  };

  /**
   * Register user via backend API /api/auth/register
   */
  const signup = async ({ name, email, password, phone }) => {
    try {
      const response = await apiClient('/api/auth/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phone: phone ? toPakServerPhone(phone) : '',
        },
      });

      const { token: receivedToken, user: receivedUser } = response;

      setToken(receivedToken);
      setUser(receivedUser);

      // Persist token and user in AsyncStorage
      await safeStorage.setItem(TOKEN_KEY, receivedToken);
      await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(receivedUser));

      return receivedUser;
    } catch (error) {
      throw new Error(error.message || 'Signup failed.');
    }
  };

  /**
   * Update profile fields (name, email, phone, dob, avatar)
   */
  const updateProfile = async (profileData) => {
    try {
      const payload = { ...profileData };
      if (payload.phone) {
        payload.phone = toPakServerPhone(payload.phone);
      }
      const response = await apiClient('/api/auth/profile', {
        method: 'PUT',
        body: payload,
      });

      if (response && response.user) {
        setUser(response.user);
        await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        return response.user;
      }
      return null;
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile.');
    }
  };

  /**
   * Permanently delete user account from database
   */
  const deleteAccount = async () => {
    try {
      await apiClient('/api/auth/profile', {
        method: 'DELETE',
      });
      await logout();
      return true;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete account.');
    }
  };

  /**
   * Logout user and wipe credentials from AsyncStorage
   */
  const logout = async () => {
    try {
      const { unregisterPushTokenFromBackend } = require('../services/pushNotificationService');
      await unregisterPushTokenFromBackend();
    } catch {
      // unregister token error ignored
    }
    setUser(null);
    setToken(null);
    try {
      await safeStorage.removeItem(TOKEN_KEY);
      await safeStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  };

  /**
   * Request 6-digit SMS OTP to Pakistani mobile number
   */
  const sendPhoneOtp = async (phone) => {
    try {
      const response = await apiClient('/api/auth/phone/send-otp', {
        method: 'POST',
        body: { phone: toPakServerPhone(phone) },
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send verification code.');
    }
  };

  /**
   * Verify SMS OTP and log in / register customer
   */
  const verifyPhoneOtp = async ({ phone, otp, name }) => {
    try {
      const response = await apiClient('/api/auth/phone/verify-otp', {
        method: 'POST',
        body: {
          phone: toPakServerPhone(phone),
          otp: otp.trim(),
          name: name ? name.trim() : '',
        },
      });

      const { token: receivedToken, user: receivedUser, isNewUser } = response;

      // Always set token in state & storage so subsequent authorized calls succeed
      setToken(receivedToken);
      await safeStorage.setItem(TOKEN_KEY, receivedToken);

      // Check if user is newly registered or still has temporary "Customer XXXX" name
      const hasPlaceholderName =
        !receivedUser.name || /^Customer \d+$/i.test(receivedUser.name.trim());
      const needsNamePrompt = !!isNewUser || hasPlaceholderName;

      if (!needsNamePrompt) {
        // Existing user with established real name -> finalize session immediately
        setUser(receivedUser);
        await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(receivedUser));
      }

      // Return user info and flag indicating whether name entry screen is needed
      return { ...receivedUser, isNewUser: needsNamePrompt };
    } catch (error) {
      throw new Error(error.message || 'Invalid verification code.');
    }
  };

  /**
   * 1-Tap Social Login (Google & Apple)
   */
  const loginWithSocial = async ({ provider, email, name, avatar, idToken }) => {
    try {
      const response = await apiClient('/api/auth/social-login', {
        method: 'POST',
        body: {
          provider,
          email,
          name: name || (provider === 'google' ? 'Google Diner' : 'Apple Diner'),
          avatar: avatar || '',
          idToken: idToken || '',
        },
      });

      const { token: receivedToken, user: receivedUser } = response;
      if (receivedToken && receivedUser) {
        setToken(receivedToken);
        setUser(receivedUser);
        await safeStorage.setItem(TOKEN_KEY, receivedToken);
        await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(receivedUser));
        return receivedUser;
      }
      throw new Error('Social authentication response invalid.');
    } catch (error) {
      throw new Error(error.message || `Failed to sign in with ${provider}.`);
    }
  };

  /**
   * Finalize login session if user skips typing name
   */
  const completePendingAuth = async (pendingUser) => {
    if (pendingUser) {
      setUser(pendingUser);
      await safeStorage.setItem(AUTH_USER_KEY, JSON.stringify(pendingUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoadingAuth,
        login,
        signup,
        loginWithSocial,
        sendPhoneOtp,
        verifyPhoneOtp,
        completePendingAuth,
        updateProfile,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
