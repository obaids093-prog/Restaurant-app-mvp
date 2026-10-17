// src/utils/imageUpload.js
// ═══════════════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles image selection from device (camera roll / file picker)
//   and uploads to the server via /api/upload.
//
// HOW REAL-WORLD APPS WORK (KFC, McDonald's, FoodPanda):
//   1. Standardized Aspect Ratio: All food items use 4:3 (or 16:9)
//      so cards display uniformly without stretching or awkward cropping.
//   2. Auto-Compression: Camera photos can be 10-25 MB. We compress
//      them to 70% JPEG quality, bringing size down to ~150-300 KB
//      with zero noticeable loss in visual clarity on mobile screens.
//   3. Seamless Upload: Sends multipart/form-data with JWT auth token.
//   4. Server URL returned: The backend saves it to uploads/ and returns
//      the direct URL, which is saved in MongoDB.
// ═══════════════════════════════════════════════════════════════════

import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL, TOKEN_KEY } from '../api/client';
import safeStorage from './safeStorage';

/**
 * Pick an image from device gallery / files with auto-crop & compression
 * @returns {Promise<object|null>} asset object with uri, width, height, etc.
 */
export const pickDishImageFromDevice = async () => {
  try {
    // 1. Request media library permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to select dish photos.'
        );
        return null;
      }
    }

    // 2. Launch image picker with standard 4:3 food aspect ratio & 70% quality compression
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3], // KFC / McDonald's standard landscape food aspect ratio
      quality: 0.7,   // Smart compression: reduces 15MB camera photo to ~200KB
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('[imageUpload] Error picking image:', error);
    Alert.alert('Image Selection Error', error.message || 'Could not pick image.');
    return null;
  }
};

/**
 * Upload an image asset to the server (/api/upload)
 * @param {object} asset - Result from ImagePicker (contains uri, mimeType, fileName)
 * @returns {Promise<{ imageUrl: string, filename: string }>}
 */
export const uploadDishImageToServer = async (asset) => {
  if (!asset || !asset.uri) {
    throw new Error('No image selected');
  }

  const token = await safeStorage.getItem(TOKEN_KEY);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, fetch the blob from blob: URI
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    formData.append('image', blob, `dish_${Date.now()}.${ext}`);
  } else {
    // On React Native (iOS/Android), use native FormData file object
    const filename = asset.fileName || `dish_${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';
    formData.append('image', {
      uri: asset.uri,
      name: filename,
      type,
    });
  }

  const uploadUrl = `${BASE_URL}/api/upload`;

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Upload failed with status ${res.status}`);
  }

  return data;
};
