import { BASE_URL } from '../api/client';

/**
 * Optimizes image URLs for cross-platform React Native (especially Android):
 * 1. Forces standard JPEG format (`fm=jpg`) on Unsplash URLs so Android native Fresco
 *    pipeline reliably decodes the image (avoids unsupported AVIF/WebP MIME types).
 * 2. Prepends BASE_URL to relative upload paths (e.g. `/uploads/dish_xyz.jpg`).
 * 3. Enforces HTTPS for Android network security policy.
 */
export const getOptimizedImageUrl = (rawUrl, fallback = null) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  let url = rawUrl.trim();

  // Prepend backend URL for local/cloud server uploads
  if (url.startsWith('/uploads/')) {
    url = `${BASE_URL}${url}`;
  } else if (url.startsWith('uploads/')) {
    url = `${BASE_URL}/${url}`;
  }

  // Force HTTPS if URL is an insecure remote HTTP link (except localhost)
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  // Optimize Unsplash links: replace auto=format with fm=jpg so Android Fresco decodes natively
  if (url.includes('images.unsplash.com')) {
    if (url.includes('auto=format')) {
      url = url.replace('auto=format', 'fm=jpg&q=80');
    } else if (!url.includes('fm=')) {
      url += (url.includes('?') ? '&' : '?') + 'fm=jpg&q=80';
    }
  }

  return url;
};

/**
 * Returns a matching culinary icon for category placeholder fallback
 */
export const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('starter') || cat.includes('appetizer')) return 'restaurant-outline';
  if (cat.includes('main') || cat.includes('entree') || cat.includes('steak')) return 'flame-outline';
  if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('cake')) return 'ice-cream-outline';
  if (cat.includes('drink') || cat.includes('beverage') || cat.includes('cocktail')) return 'wine-outline';
  return 'fast-food-outline';
};
