import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function CategoryChip({
  label,
  icon,
  active = false,
  onPress,
  accessibilityLabel,
}) {
  const { colors, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.wrapper}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View
        style={[
          styles.circleContainer,
          {
            backgroundColor: active ? colors.primary : colors.surfaceSubtle,
            borderColor: active ? colors.primary : colors.subtleBorder,
          },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          typography.caption,
          styles.label,
          {
            color: active ? colors.primary : colors.textSecondary,
            fontWeight: active ? '600' : '400',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 56,
    minHeight: 80,
  },
  circleContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
  },
  label: {
    textAlign: 'center',
  },
});
