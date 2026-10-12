import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnboardingSlide({
  title,
  description,
  icon = 'restaurant-outline',
  index = 0,
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* Visual Composition without third-party images */}
      <View
        style={[
          styles.illustrationOuter,
          {
            backgroundColor: colors.primaryTint,
            borderRadius: radius.card + 10,
          },
        ]}
      >
        <View
          style={[
            styles.illustrationMiddle,
            {
              backgroundColor: colors.card,
              borderColor: colors.subtleBorder,
              borderRadius: radius.card,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Ionicons name={icon} size={48} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      <Text
        style={[
          typography.headingLg,
          styles.title,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          styles.description,
          { color: colors.mutedText },
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  illustrationOuter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  illustrationMiddle: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});
