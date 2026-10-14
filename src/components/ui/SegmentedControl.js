import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SegmentedControl({
  segments = [], // Array of string or { id, label }
  selectedIndex = 0,
  onChange,
  style,
}) {
  const { colors, typography, radius, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const numSegments = Math.max(segments.length, 1);
  const pillWidth = containerWidth > 0 ? (containerWidth - 8) / numSegments : 0;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const isInitialized = useRef(false);

  useEffect(() => {
    if (pillWidth > 0) {
      if (!isInitialized.current) {
        slideAnim.setValue(selectedIndex * pillWidth);
        isInitialized.current = true;
      } else {
        Animated.timing(slideAnim, {
          toValue: selectedIndex * pillWidth,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [selectedIndex, pillWidth, slideAnim]);

  const handleLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    if (!isInitialized.current && w > 0) {
      const pWidth = (w - 8) / numSegments;
      slideAnim.setValue(selectedIndex * pWidth);
      isInitialized.current = true;
    }
  };

  return (
    <View
      onLayout={handleLayout}
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
      {/* Sliding Active Pill */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            styles.activePill,
            {
              width: pillWidth,
              borderRadius: radius.button - 2,
              backgroundColor: colors.surface,
              transform: [{ translateX: slideAnim }],
            },
            !isDark && {
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 2,
            },
            isDark && {
              borderWidth: 1,
              borderColor: colors.cardBorder,
            },
          ]}
        />
      )}

      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        const label = typeof segment === 'string' ? segment : segment.label;
        const key = typeof segment === 'string' ? segment : segment.id || index;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange && onChange(index)}
            activeOpacity={0.8}
            style={styles.segmentItem}
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
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  segmentText: {
    fontSize: 14,
  },
});
