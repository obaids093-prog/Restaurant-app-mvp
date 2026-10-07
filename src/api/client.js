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

// Laptop's local network IP on Wi-Fi adapter (10.0.4.146)
// Using localhost on Web for instant browser testing, and LAN IP on native devices (iOS/Android)
export const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.4.146:5000';

export const TOKEN_KEY = '@restaurant_app_auth_token';

/**
 * Core HTTP client helper
 * @param {string} endpoint - API endpoint (e.g. '/api/menu' or 'menu')
 * @param {object} options - fetch options (method, body, headers, customToken)
 * @returns {Promise<any>} - parsed JSON response
 */
export const apiClient = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Retrieve JWT auth token from safe storage if not explicitly provided
  let token = options.token;
  if (!token) {
    try {
      token = await safeStorage.getItem(TOKEN_KEY);
    } catch (e) {
      // Storage access error, continue without token
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    let data;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's a network disconnect / server offline error
    if (!error.status) {
      console.warn(`[apiClient] Network connection failed to ${url}:`, error.message);
      throw new Error(`Unable to reach server at ${BASE_URL}. Ensure backend is running.`);
    }
    throw error;
  }
};

export default apiClient;
