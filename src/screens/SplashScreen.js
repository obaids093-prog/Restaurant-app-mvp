/**
 * src/screens/SplashScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Animated Splash Screen
 * Short in-app splash: logo fades and scales in 600ms, tagline 300ms,
 * thin progress line. Navigates to Onboarding or Login when ready.
 * ═══════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@aura_onboarding_complete';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, typography, fonts } = useTheme();

  // Animations
  const emblemScale = useRef(new Animated.Value(0.6)).current;
  const emblemOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo fades and scales in (600 ms)
    Animated.parallel([
      Animated.spring(emblemScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(emblemOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Tagline fades in (300 ms after 300ms delay)
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Thin progress line expands
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 850,
      useNativeDriver: false,
    }).start();

    // Navigation decision after ~900ms
    const timer = setTimeout(async () => {
      try {
        const seen = await safeStorage.getItem(ONBOARDING_KEY);
        if (seen === 'true') {
          navigation.replace('Login');
        } else {
          navigation.replace('Onboarding');
        }
      } catch (err) {
        navigation.replace('Onboarding');
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [navigation, emblemScale, emblemOpacity, wordmarkOpacity, taglineOpacity, progressAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Ambient background decoration */}
      <View
        style={[
          styles.glowTopLeft,
          { backgroundColor: colors.onPrimary, opacity: 0.12 },
        ]}
      />
      <View
        style={[
          styles.glowBottomRight,
          { backgroundColor: colors.primaryPressed, opacity: 0.4 },
        ]}
      />

      {/* Center branding */}
      <View style={[styles.centerContent, { paddingTop: insets.top }]}>
        {/* Emblem */}
        <Animated.View
          style={[
            styles.emblemOuter,
            {
              transform: [{ scale: emblemScale }],
              opacity: emblemOpacity,
            },
          ]}
        >
          <View
            style={[
              styles.emblemInner,
              {
                backgroundColor: colors.onPrimary,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <Ionicons name="flame" size={38} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Brand Wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            {
              fontFamily: fonts.bold,
              color: colors.onPrimary,
              opacity: wordmarkOpacity,
            },
          ]}
        >
          {brand.appName}
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              fontFamily: fonts.medium,
              color: colors.onPrimary,
              opacity: taglineOpacity,
            },
          ]}
        >
          {brand.tagline.toUpperCase()}
        </Animated.Text>

        {/* Thin progress line */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.onPrimary, opacity: 0.25 },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.onPrimary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Bottom subtle copyright / edition */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        <Text
          style={[
            typography.caption,
            { color: colors.onPrimary, opacity: 0.75, letterSpacing: 0.8 },
          ]}
        >
          {brand.restaurantName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  emblemOuter: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emblemInner: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmark: {
    fontSize: 44,
    letterSpacing: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 2.5,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 28,
  },
  progressTrack: {
    width: 140,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
