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

/**
 * Normalizes any Pakistani phone format into display and raw forms.
 *
 * Accepted inputs:
 *   0312-8556555, 03128556555, 3128556555,
 *   +923128556555, 923128556555, 0312 8556555
 *
 * @param {string} input - Raw phone input string
 * @returns {{ display: string, raw: string, isValid: true } | { error: string, isValid: false }}
 */
export const normalizePkPhone = (input) => {
  if (!input || typeof input !== 'string') {
    return { error: 'Phone number is required.', isValid: false };
  }
  const digits = input.replace(/\D/g, '');
  if (!digits) {
    return { error: 'Phone number is required.', isValid: false };
  }

  let tenDigit = ''; // target: 3XXXXXXXXX

  if (/^3\d{9}$/.test(digits)) {
    // 3001234567
    tenDigit = digits;
  } else if (/^03\d{9}$/.test(digits)) {
    // 03001234567
    tenDigit = digits.slice(1);
  } else if (/^923\d{9}$/.test(digits)) {
    // 923001234567
    tenDigit = digits.slice(2);
  } else if (/^00923\d{9}$/.test(digits)) {
    // 0092 3001234567
    tenDigit = digits.slice(4);
  } else {
    return { error: 'Phone must be a valid Pakistani mobile number (03XX-XXXXXXX).', isValid: false };
  }

  const display = `0${tenDigit.slice(0, 3)}-${tenDigit.slice(3)}`;
  return { display, raw: tenDigit, isValid: true };
};

export default toPakServerPhone;
