/**
 * src/screens/OnboardingScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — 3-Slide Onboarding Polish
 * Parallax slide layers, looping custom vector illustrations,
 * stretching pill dots, smooth button cross-fade, background
 * gradient shifting, and reduce-motion accessibility.
 * ═══════════════════════════════════════════════════════════
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { OnboardingSlide } from '../components/ui';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';
import { SafeLinearGradient } from '../utils/SafeLinearGradient';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@aura_onboarding_complete';

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, fonts, shadows } = useTheme();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const slides = brand.onboardingSlides;

  // Accessibility: detect reduce motion preference
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (isMounted) setReduceMotion(!!enabled);
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      if (isMounted) setReduceMotion(!!enabled);
    });
    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  // Check if onboarding was already seen
  useEffect(() => {
    (async () => {
      try {
        const seen = await safeStorage.getItem(ONBOARDING_KEY);
        if (seen === 'true') {
          navigation.replace('Login');
        }
      } catch (e) {
        // Continue showing onboarding if storage fails
      }
    })();
  }, [navigation]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Also track index via onMomentumScrollEnd as a reliable fallback
  const handleMomentumScrollEnd = useCallback((e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  }, []);

  // Use a ref to avoid stale closure in handleNext
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const handleNext = useCallback(async () => {
    const idx = currentIndexRef.current;
    if (idx < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: idx + 1, animated: true });
    } else {
      // Mark onboarding as complete
      try {
        await safeStorage.setItem(ONBOARDING_KEY, 'true');
      } catch (e) {
        console.warn('Failed to persist onboarding state', e);
      }
      navigation.replace('Login');
    }
  }, [slides.length, navigation]);

  const handleSkip = useCallback(async () => {
    try {
      await safeStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.warn('Failed to persist onboarding state', e);
    }
    navigation.replace('Login');
  }, [navigation]);

  const isLast = currentIndex === slides.length - 1;

  // Render individual slide with parallax and active states
  const renderSlide = useCallback(
    ({ item, index }) => (
      <OnboardingSlide
        title={item.title}
        description={item.description}
        icon={item.icon}
        index={index}
        scrollX={scrollX}
        isActive={currentIndex === index}
        reduceMotion={reduceMotion}
      />
    ),
    [currentIndex, scrollX, reduceMotion]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Parallax: background shapes drift at a third speed
  const bgShapeTranslateX = reduceMotion
    ? 0
    : scrollX.interpolate({
        inputRange: [0, 2 * width],
        outputRange: [0, -width * 0.33],
        extrapolate: 'clamp',
      });

  const bgShapeTranslateXReverse = reduceMotion
    ? 0
    : scrollX.interpolate({
        inputRange: [0, 2 * width],
        outputRange: [0, width * 0.25],
        extrapolate: 'clamp',
      });

  // Smooth CTA button cross-fade: Next -> Get Started
  const nextOpacity = scrollX.interpolate({
    inputRange: [width, 1.8 * width, 2 * width],
    outputRange: [1, 0.2, 0],
    extrapolate: 'clamp',
  });

  const getStartedOpacity = scrollX.interpolate({
    inputRange: [width, 1.8 * width, 2 * width],
    outputRange: [0, 0.2, 1],
    extrapolate: 'clamp',
  });

  // Skip button fades out on last slide
  const skipOpacity = scrollX.interpolate({
    inputRange: [width, 1.8 * width, 2 * width],
    outputRange: [1, 0.2, 0],
    extrapolate: 'clamp',
  });

  // Background gradient opacities shifting gently across the 3 slides
  const grad0Opacity = scrollX.interpolate({
    inputRange: [0, width],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const grad1Opacity = scrollX.interpolate({
    inputRange: [0, width, 2 * width],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const grad2Opacity = scrollX.interpolate({
    inputRange: [width, 2 * width],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background Gradient Shifts Gently */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad0Opacity }]}>
          <SafeLinearGradient
            colors={isDark ? ['#1A1310', '#121212', '#121212'] : ['#FFF5F1', '#FFFFFF', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad1Opacity }]}>
          <SafeLinearGradient
            colors={isDark ? ['#1B1710', '#121212', '#121212'] : ['#FFF9EE', '#FFFFFF', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad2Opacity }]}>
          <SafeLinearGradient
            colors={isDark ? ['#1E1210', '#121212', '#121212'] : ['#FFF2EE', '#FFFFFF', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
          />
        </Animated.View>
      </View>

      {/* Background Shapes drifting at a third speed */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientCircleTop,
            {
              backgroundColor: colors.primaryTint,
              transform: [{ translateX: bgShapeTranslateX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ambientCircleBottom,
            {
              backgroundColor: colors.surfaceSubtle,
              transform: [{ translateX: bgShapeTranslateXReverse }],
            },
          ]}
        />
      </View>

      {/* Top Bar: Brand badge + Fading Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View
          style={[
            styles.brandBadge,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
          ]}
        >
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text
            style={[
              styles.brandBadgeText,
              { color: colors.textSecondary, fontFamily: fonts.semiBold },
            ]}
          >
            {brand.appName}
          </Text>
        </View>

        <Animated.View style={{ opacity: skipOpacity }} pointerEvents={isLast ? 'none' : 'auto'}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
            accessibilityLabel="Skip Onboarding"
          >
            <Text
              style={[
                styles.skipText,
                { color: colors.mutedText, fontFamily: fonts.medium },
              ]}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Slide content */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* Bottom: Dots + CTA */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* Pill dots: stretch and fill */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button: Smoothly transitions Next -> Get Started */}
        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.ctaButton,
            { backgroundColor: colors.primary },
            shadows.buttonPrimary,
          ]}
          activeOpacity={0.85}
          accessibilityLabel={isLast ? 'Get Started' : 'Next Slide'}
        >
          <View style={styles.ctaContentWrapper}>
            {/* Next state */}
            <Animated.View style={[styles.ctaRow, { opacity: nextOpacity }]}>
              <Text
                style={[
                  styles.ctaText,
                  { color: colors.onPrimary, fontFamily: fonts.semiBold },
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.onPrimary}
              />
            </Animated.View>

            {/* Get Started state */}
            <Animated.View
              style={[
                styles.ctaRow,
                styles.ctaAbsolute,
                { opacity: getStartedOpacity },
              ]}
            >
              <Text
                style={[
                  styles.ctaText,
                  { color: colors.onPrimary, fontFamily: fonts.semiBold },
                ]}
              >
                Get Started
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.onPrimary}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Progress label */}
        <Text
          style={[
            styles.progressLabel,
            { color: colors.mutedText, fontFamily: fonts.regular },
          ]}
        >
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientCircleTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.45,
  },
  ambientCircleBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    zIndex: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  brandBadgeText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 380,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaContentWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaAbsolute: {
    position: 'absolute',
  },
  ctaText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  progressLabel: {
    fontSize: 12,
  },
});
