/**
 * src/api/client.js
 * ═══════════════════════════════════════════════════════════
 * Centralized API client for AURA Restaurant App (Assignment 2)
 *
 * Requirements (Question 6):
 *   - BASE_URL defined in ONE place only (laptop IP:port)
 *   - Helper function that sends requests, adds JSON headers & JWT token
 *   - Throws error with server message on failure
 * ═══════════════════════════════════════════════════════════
 */

import { Platform } from 'react-native';
import safeStorage from '../utils/safeStorage';

// Laptop's active local network IP on Wi-Fi adapter (192.168.100.6)
// Using localhost on Web for instant browser testing, and LAN IP on native devices (iOS/Android)
export const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.100.8:5000';

export const TOKEN_KEY = '@restaurant_app_auth_token';

/**
 * Helper to retrieve stored token if not explicitly provided
 */
const resolveAuthToken = async (customToken) => {
  if (customToken) return customToken;
  try {
    return await safeStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

/**
 * Helper to parse response body according to content-type
 */
const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return { message: text };
};

/**
 * Helper to extract descriptive server error message
 */
const extractErrorMessage = (data, status) => {
  const detail = data?.error || data?.message;
  if (data?.message && data?.error && data.message !== data.error) {
    return `${data.message} (${data.error})`;
  }
  return detail || `Request failed with status ${status}`;
};

/**
 * Helper to handle network disconnects and request timeouts
 */
const handleRequestError = (error, isAborted, url) => {
  if (error.name === 'AbortError' || isAborted) {
    throw new Error('Cannot reach server. Check your Wi-Fi and try again.');
  }
  if (!error.status) {
    console.warn(`[apiClient] Network connection failed to ${url}:`, error.message);
    throw new Error(`Unable to reach server at ${BASE_URL}. Ensure backend is running.`);
  }
  throw error;
};

/**
 * Core HTTP client helper
 * @param {string} endpoint - API endpoint (e.g. '/api/menu' or 'menu')
 * @param {object} options - fetch options (method, body, headers, customToken)
 * @returns {Promise<any>} - parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const token = await resolveAuthToken(options.token);

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  const config = {
    method: options.method || 'GET',
    headers,
    signal: controller.signal,
    ...(Platform.OS === 'web' ? { cache: 'no-store' } : {}),
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const error = new Error(extractErrorMessage(data, response.status));
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    handleRequestError(error, controller.signal.aborted, url);
  }
};

export default apiClient;
