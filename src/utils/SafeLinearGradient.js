/**
 * Safe LinearGradient Wrapper
 * Falls back to a simple View with the first gradient color as background
 * when the native module is unavailable (e.g. in certain Expo Go configurations).
 */
import React from 'react';
import { View } from 'react-native';

let RealLinearGradient = null;

try {
  // Attempt to import the native LinearGradient module
  const mod = require('expo-linear-gradient');
  if (mod && mod.LinearGradient) {
    RealLinearGradient = mod.LinearGradient;
  }
} catch (e) {
  console.warn('[SafeLinearGradient] expo-linear-gradient not available, using View fallback:', e.message);
}

/**
 * SafeLinearGradient
 * API-compatible drop-in replacement for expo-linear-gradient's LinearGradient.
 * When native module is null/unavailable, renders a plain View with
 * the first color from the colors array as backgroundColor.
 */
export function SafeLinearGradient({ colors: gradientColors, style, children, ...rest }) {
  // Ensure array is valid and elements are non-empty strings
  const validColors =
    Array.isArray(gradientColors) && gradientColors.length >= 2 && gradientColors.every((c) => Boolean(c) && typeof c === 'string')
      ? gradientColors
      : ['#FC5834', '#E04A27'];

  if (RealLinearGradient) {
    return (
      <RealLinearGradient colors={validColors} style={style} {...rest}>
        {children}
      </RealLinearGradient>
    );
  }

  // Fallback: use first gradient color as solid background
  const fallbackColor = validColors[0] || '#FC5834';

  return (
    <View style={[{ backgroundColor: fallbackColor }, style]} {...rest}>
      {children}
    </View>
  );
}

export const LinearGradient = SafeLinearGradient;
export default SafeLinearGradient;
