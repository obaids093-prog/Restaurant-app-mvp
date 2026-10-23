import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  syncPushTokenWithBackend,
} from '../services/pushNotificationService';
import { navigationRef } from '../navigation/AppNavigator';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const notificationState = useNotifications();
  const [pushToken, setPushToken] = useState(null);
  const [activeBannerNotification, setActiveBannerNotification] = useState(null);

  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Register push token when authenticated user signs in
  useEffect(() => {
    let isCancelled = false;

    if (user?._id) {
      registerForPushNotificationsAsync()
        .then((token) => {
          if (!isCancelled && token) {
            setPushToken(token);
            syncPushTokenWithBackend(token);
          }
        })
        .catch((err) => {
          console.warn('[NotificationProvider] Push setup error:', err.message);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [user?._id]);

  // Set up listeners for foreground push notifications & user responses
  useEffect(() => {
    try {
      // Listener for foreground notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          const content = notification?.request?.content || {};
          setActiveBannerNotification({
            title: content.title || 'AURA Alert',
            body: content.body || '',
            data: content.data || {},
          });

          // Refresh in-app notifications and unread badge count
          if (notificationState?.refreshNotifications) {
            notificationState.refreshNotifications();
          }
          if (notificationState?.fetchUnreadCount) {
            notificationState.fetchUnreadCount();
          }
        }
      );

      // Listener for when a user taps/interacts with a notification banner
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response?.notification?.request?.content?.data || {};

          if (navigationRef.isReady()) {
            if (data.type === 'order_status' || data.orderId) {
              navigationRef.navigate('TrackTab');
            } else {
              navigationRef.navigate('Notifications');
            }
          }
        }
      );
    } catch (err) {
      console.warn(
        '[NotificationProvider] Failed to register notification listeners:',
        err.message
      );
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch {
        // cleanup error ignored
      }
    };
  }, [notificationState]);

  const dismissBannerNotification = () => {
    setActiveBannerNotification(null);
  };

  const contextValue = {
    ...notificationState,
    pushToken,
    activeBannerNotification,
    dismissBannerNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
