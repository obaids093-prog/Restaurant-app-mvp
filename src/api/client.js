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

// Local development connects to laptop server (192.168.100.6:5000) when scanning Expo QR code;
// Web browser uses localhost:5000; production falls back to Render cloud.
const DEV_LAN_IP = '192.168.100.6';
export const BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:5000'
    : `http://${DEV_LAN_IP}:5000`
  : 'https://aura-app-49n0.onrender.com';

export const TOKEN_KEY = '@restaurant_app_auth_token';

// Cold start constants
export const TIMEOUT_MS = 45000;
export const WAKING_BANNER_THRESHOLD_MS = 5000;

// Listeners for waking banner: "Waking up the server, please wait"
const wakingListeners = new Set();
let activeSlowRequestsCount = 0;

export const subscribeServerWaking = (listener) => {
  wakingListeners.add(listener);
  return () => wakingListeners.delete(listener);
};

export const notifyServerWaking = (isWaking) => {
  wakingListeners.forEach((fn) => {
    try {
      fn(isWaking);
    } catch (err) {
      console.warn('[apiClient] wakingListener error:', err);
    }
  });
};

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
 * @param {object} options - fetch options (method, body, headers, customToken, _isRetry)
 * @returns {Promise<any>} - parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const token = await resolveAuthToken(options.token);

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  let timedOut = false;

  // 45s timeout to gracefully accommodate Render free-tier cold starts
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  // Show "Waking up the server, please wait" banner when request takes >5s
  let isSlow = false;
  const slowTimerId = setTimeout(() => {
    isSlow = true;
    activeSlowRequestsCount++;
    if (activeSlowRequestsCount === 1) {
      notifyServerWaking(true);
    }
  }, WAKING_BANNER_THRESHOLD_MS);

  const cleanupTimers = () => {
    clearTimeout(timeoutId);
    clearTimeout(slowTimerId);
    if (isSlow) {
      isSlow = false;
      activeSlowRequestsCount = Math.max(0, activeSlowRequestsCount - 1);
      if (activeSlowRequestsCount === 0) {
        notifyServerWaking(false);
      }
    }
  };

  const config = {
    method,
    headers,
    signal: controller.signal,
    ...(Platform.OS === 'web' ? { cache: 'no-store' } : {}),
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    cleanupTimers();

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const error = new Error(extractErrorMessage(data, response.status));
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    cleanupTimers();

    const wasAborted = controller.signal.aborted || error.name === 'AbortError' || timedOut;

    // Retry a timed out GET request once automatically (never retry POST/PUT/DELETE)
    if (wasAborted && method === 'GET' && !options._isRetry) {
      console.warn(`[apiClient] GET ${cleanEndpoint} timed out after 45s. Retrying once...`);
      return apiClient(endpoint, {
        ...options,
        _isRetry: true,
      });
    }

    handleRequestError(error, wasAborted, url);
  }
};

apiClient.get = async (endpoint, options = {}) => {
  const data = await apiClient(endpoint, { ...options, method: 'GET' });
  return { data, status: 200 };
};

apiClient.post = async (endpoint, body, options = {}) => {
  const data = await apiClient(endpoint, { ...options, method: 'POST', body });
  return { data, status: 200 };
};

apiClient.patch = async (endpoint, body, options = {}) => {
  const data = await apiClient(endpoint, { ...options, method: 'PATCH', body });
  return { data, status: 200 };
};

apiClient.put = async (endpoint, body, options = {}) => {
  const data = await apiClient(endpoint, { ...options, method: 'PUT', body });
  return { data, status: 200 };
};

apiClient.delete = async (endpoint, options = {}) => {
  const data = await apiClient(endpoint, { ...options, method: 'DELETE' });
  return { data, status: 200 };
};

export default apiClient;

