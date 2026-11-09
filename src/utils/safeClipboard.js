/**
 * Safe Clipboard Wrapper
 * Uses expo-clipboard if available, with web navigator.clipboard fallback.
 */
import { Platform } from 'react-native';

let ExpoClipboard = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch {
  // Graceful fallback when module is not installed or unavailable
}

export async function setStringAsync(text) {
  try {
    if (ExpoClipboard && typeof ExpoClipboard.setStringAsync === 'function') {
      return await ExpoClipboard.setStringAsync(text);
    }
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[safeClipboard] setStringAsync failed:', err?.message || err);
  }
  return false;
}

export async function getStringAsync() {
  try {
    if (ExpoClipboard && typeof ExpoClipboard.getStringAsync === 'function') {
      return await ExpoClipboard.getStringAsync();
    }
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch (err) {
    console.warn('[safeClipboard] getStringAsync failed:', err?.message || err);
  }
  return '';
}

export default {
  setStringAsync,
  getStringAsync,
};
