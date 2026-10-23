import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { safeStorage } from '../utils/safeStorage';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels and request permission for push notifications
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });

      await Notifications.setNotificationChannelAsync('aura-order-updates', {
        name: 'AURA Order & Dining Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    } catch (e) {
      console.warn('[Push Notification] Channel setup failed:', e.message);
    }
  }

  if (Platform.OS !== 'web') {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData?.data || null;
    } catch (err) {
      // In simulator or Expo Go without projectId, token fetch might fail non-fatally
      console.warn('[Push Notification] Token retrieval unavailable:', err.message);
    }
  }

  return token;
}

/**
 * Sync the device token with the server for the logged in user
 */
export async function syncPushTokenWithBackend(token) {
  if (!token) return;
  try {
    await apiClient('/api/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    await safeStorage.setItem('@aura_push_token', token);
  } catch (err) {
    console.warn('[Push Notification] Failed to sync token with backend:', err.message);
  }
}

/**
 * Unregister device token when user logs out
 */
export async function unregisterPushTokenFromBackend() {
  try {
    const storedToken = await safeStorage.getItem('@aura_push_token');
    if (storedToken) {
      await apiClient('/api/notifications/push-token', {
        method: 'DELETE',
        body: JSON.stringify({ token: storedToken }),
      });
      await safeStorage.removeItem('@aura_push_token');
    }
  } catch (err) {
    console.warn('[Push Notification] Failed to unregister token on logout:', err.message);
  }
}
