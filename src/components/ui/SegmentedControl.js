import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SegmentedControl({
  segments = [], // Array of string or { id, label }
  selectedIndex = 0,
  onChange,
  style,
}) {
  const { colors, typography, radius, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.subtleBorder,
          borderRadius: radius.card,
        },
        style,
      ]}
    >
      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        const label = typeof segment === 'string' ? segment : segment.label;
        const key = typeof segment === 'string' ? segment : segment.id || index;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange && onChange(index)}
            activeOpacity={0.8}
            style={[
              styles.segmentItem,
              {
                borderRadius: radius.button - 2,
                backgroundColor: isSelected ? colors.surface : 'transparent',
              },
              isSelected &&
                !isDark && {
                  shadowColor: colors.shadowColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                },
              isSelected &&
                isDark && {
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                typography.caption,
                styles.segmentText,
                {
                  color: isSelected ? colors.primary : colors.mutedText,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    width: '100%',
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentText: {
    fontSize: 14,
  },
});
