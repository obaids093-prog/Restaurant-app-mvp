import React, { createContext, useContext, useState, useEffect } from 'react';
import safeStorage from '../utils/safeStorage';
import { apiClient, TOKEN_KEY } from '../api/client';

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
  const signup = async ({ name, email, password, role, phone }) => {
    try {
      const response = await apiClient('/api/auth/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: role || 'customer',
          phone: phone ? phone.trim() : '',
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
   * Logout user and wipe credentials from AsyncStorage
   */
  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await safeStorage.removeItem(TOKEN_KEY);
      await safeStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
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
