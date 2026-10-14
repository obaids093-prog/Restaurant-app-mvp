import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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

  // 6-second slow ambient drift loop (opacity & transform only with useNativeDriver)
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [driftAnim]);

  const circle1TranslateX = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  const circle1TranslateY = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const circle1Scale = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const circle1Opacity = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.10, 0.20],
  });

  const circle2TranslateX = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const circle2TranslateY = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const circle2Scale = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });
  const circle2Opacity = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.16],
  });

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
      {/* Decorative ambient background rings drifting slowly in a 6s loop */}
      <Animated.View
        style={[
          styles.ambientCircle1,
          {
            opacity: circle1Opacity,
            transform: [
              { translateX: circle1TranslateX },
              { translateY: circle1TranslateY },
              { scale: circle1Scale },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientCircle2,
          {
            opacity: circle2Opacity,
            transform: [
              { translateX: circle2TranslateX },
              { translateY: circle2TranslateY },
              { scale: circle2Scale },
            ],
          },
        ]}
      />

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
    backgroundColor: '#FFFFFF',
  },
  ambientCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
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
