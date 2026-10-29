/**
 * Safe Storage Wrapper with SecureStore & Migration
 * ═══════════════════════════════════════════════════════════
 * - Sensitive auth tokens: stored in hardware-backed expo-secure-store on iOS/Android
 * - Auto-migration: checks plain AsyncStorage, migrates existing tokens to SecureStore, deletes old copy
 * - Web fallback: window.localStorage when running in web browser
 * - Memory dictionary fallback: ensures app never crashes if native storage is unavailable
 * ═══════════════════════════════════════════════════════════
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map();

/**
 * Sanitizes key to only contain [a-zA-Z0-9._-] as required by Android Keystore / iOS Keychain
 */
export const sanitizeSecureKey = (key) => {
  return String(key).replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Identifies whether a storage key contains sensitive security data (e.g. auth tokens)
 */
export const isSecureKey = (key) => {
  const lower = String(key).toLowerCase();
  return lower.includes('token') || lower.includes('auth') || lower.includes('secret');
};

/**
 * SecureStore retrieval with automatic migration from AsyncStorage and web fallback
 */
export async function getSecureItem(key) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== undefined) return val;
    }
    return memoryFallback.get(key) || null;
  }

  const secureKey = sanitizeSecureKey(key);

  // 1. Try retrieving from hardware-backed SecureStore
  try {
    const secureVal = await SecureStore.getItemAsync(secureKey);
    if (secureVal !== null && secureVal !== undefined) {
      return secureVal;
    }
  } catch (err) {
    console.warn(`[safeStorage] SecureStore.getItemAsync failed for "${secureKey}":`, err.message);
  }

  // 2. Migration: Check old unencrypted AsyncStorage for legacy token
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const legacyVal = await AsyncStorage.getItem(key);
      if (legacyVal !== null && legacyVal !== undefined) {
        // Migrate to SecureStore and clean up legacy plaintext storage
        try {
          await SecureStore.setItemAsync(secureKey, legacyVal);
          await AsyncStorage.removeItem(key);
          console.log(`[safeStorage] Migrated "${key}" from AsyncStorage to SecureStore.`);
        } catch (migErr) {
          console.warn(`[safeStorage] Migration to SecureStore failed:`, migErr.message);
        }
        return legacyVal;
      }
    }
  } catch (err) {
    console.warn(`[safeStorage] AsyncStorage migration lookup failed for "${key}":`, err.message);
  }

  return memoryFallback.get(key) || null;
}

/**
 * SecureStore persistence with web fallback
 */
export async function setSecureItem(key, value) {
  memoryFallback.set(key, value);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }

  const secureKey = sanitizeSecureKey(key);

  try {
    await SecureStore.setItemAsync(secureKey, value);
    // Remove from unencrypted AsyncStorage to ensure clean migration
    if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[safeStorage] SecureStore.setItemAsync failed for "${secureKey}":`, err.message);
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
    }
  }
}

/**
 * SecureStore deletion with web fallback
 */
export async function removeSecureItem(key) {
  memoryFallback.delete(key);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }

  const secureKey = sanitizeSecureKey(key);

  try {
    await SecureStore.deleteItemAsync(secureKey);
  } catch (err) {
    console.warn(`[safeStorage] SecureStore.deleteItemAsync failed for "${secureKey}":`, err.message);
  }

  try {
    if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    }
  } catch (err) {
    // ignore
  }
}

export const safeStorage = {
  async getItem(key) {
    if (isSecureKey(key)) {
      return getSecureItem(key);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      }
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const value = await AsyncStorage.getItem(key);
        if (value !== null && value !== undefined) return value;
      }
    } catch (e) {
      console.warn(`[safeStorage] getItem failed for "${key}", using memory fallback:`, e.message);
    }
    return memoryFallback.get(key) || null;
  },

  async setItem(key, value) {
    if (isSecureKey(key)) {
      return setSecureItem(key, value);
    }

    memoryFallback.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[safeStorage] setItem failed for "${key}", using memory fallback:`, e.message);
    }
  },

  async removeItem(key) {
    if (isSecureKey(key)) {
      return removeSecureItem(key);
    }

    memoryFallback.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] removeItem failed for "${key}":`, e.message);
    }
  },
};

export default safeStorage;
