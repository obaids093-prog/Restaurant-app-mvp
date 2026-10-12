import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Card({
  children,
  style,
  onPress,
  disabled = false,
  padding = 16,
  accessibilityLabel,
}) {
  const { colors, isDark, radius } = useTheme();

  const cardStyle = [
    styles.baseCard,
    {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    !isDark && styles.lightShadow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={cardStyle}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  baseCard: {
    overflow: 'hidden',
  },
  lightShadow: {
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
});
