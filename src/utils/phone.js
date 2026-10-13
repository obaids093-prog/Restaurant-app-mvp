/**
 * src/utils/phone.js
 * ═══════════════════════════════════════════════════════════
 * Pakistani Phone Number Normalization Utility
 *
 * Converts Pakistani mobile numbers (including 10-digit raw strings
 * stored by PhoneInput, e.g. "3001234567") into the canonical server
 * format "03XXXXXXXXX" accepted by the backend normalizePakPhone().
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Converts a phone number string to canonical Pakistani server format: "03XXXXXXXXX"
 *
 * @param {string} phone - Raw phone input (e.g. "3001234567", "+923001234567", "03001234567")
 * @returns {string} - Canonical server format "03XXXXXXXXX", or empty string if invalid/empty
 */
export const toPakServerPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // 10 digits starting with 3 (PhoneInput format: 3XXXXXXXXX) -> prefix with '0'
  if (/^3\d{9}$/.test(digits)) {
    return `0${digits}`;
  }

  // 11 digits starting with 03 (Standard format: 03XXXXXXXXX)
  if (/^03\d{9}$/.test(digits)) {
    return digits;
  }

  // 12 digits starting with 923 (from +923XXXXXXXXX) -> replace 92 with 0
  if (/^923\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  // 13 digits starting with 00923 (from 00923XXXXXXXXX) -> replace 0092 with 0
  if (/^00923\d{9}$/.test(digits)) {
    return `0${digits.slice(4)}`;
  }

  // Fallback to trimmed original
  return phone.trim();
};

export default toPakServerPhone;
