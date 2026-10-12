import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../utils/SafeLinearGradient';
import { useTheme } from '../../context/ThemeContext';
import { brand } from '../../config/brand';

export default function HeroCard({
  title = brand.appName,
  subtitle = brand.tagline,
  icon = 'restaurant-outline',
  curvedBottom = true,
  children,
  style,
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryPressed]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroContainer,
        curvedBottom && {
          borderBottomLeftRadius: radius.sheet + 8,
          borderBottomRightRadius: radius.sheet + 8,
        },
        style,
      ]}
    >
      {/* Decorative ambient background rings */}
      <View style={styles.ambientCircle1} />
      <View style={styles.ambientCircle2} />

      {/* Monogram Cloche Emblem */}
      <View
        style={[
          styles.emblemWrapper,
          {
            borderRadius: radius.card - 4,
            backgroundColor: colors.onPrimary,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.display,
          styles.title,
          { color: colors.onPrimary },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            typography.caption,
            styles.subtitle,
            { color: 'rgba(255, 255, 255, 0.90)' },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {children ? <View style={styles.childrenContainer}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  ambientCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emblemWrapper: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  childrenContainer: {
    width: '100%',
    marginTop: 16,
  },
});
