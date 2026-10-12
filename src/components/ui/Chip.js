import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const { colors, typography, radius } = useTheme();

  const isInteractive = Boolean(onPress);

  const containerStyle = [
    styles.baseChip,
    {
      borderRadius: radius.pill,
      backgroundColor: selected ? colors.primary : colors.surfaceSubtle,
      borderColor: selected ? colors.primary : colors.subtleBorder,
    },
    style,
  ];

  const content = (
    <View style={styles.contentRow}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text
        style={[
          typography.caption,
          {
            color: selected ? colors.onPrimary : colors.textPrimary,
            fontWeight: selected ? '600' : '500',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={containerStyle}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  baseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
});
