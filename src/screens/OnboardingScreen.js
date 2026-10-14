/**
 * src/screens/OnboardingScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Luxury Photographic Onboarding
 * 58/42 split architecture:
 * • Top: Cinematic food photography, dark scrim, pillar badge,
 *   VIP concierge badge, and atmosphere sound toggle.
 * • Bottom: Curved sheet, 3 feature checklist tiles, expanding
 *   pill indicators, step counter 01/03, primary gradient CTA,
 *   and "Already a Member? Sign in" shortcut.
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
  const [isMuted, setIsMuted] = useState(false);

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

  // Render individual slide with photography and 3 feature tiles
  const renderSlide = useCallback(
    ({ item, index }) => (
      <OnboardingSlide
        item={item}
        index={index}
        scrollX={scrollX}
        isActive={currentIndex === index}
        reduceMotion={reduceMotion}
      />
    ),
    [currentIndex, scrollX, reduceMotion]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Smooth CTA button cross-fade: Begin Artisan Journey -> Enter Artisan Concierge
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#141211' : '#F8F9FA' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Top Bar (Brand + Atmosphere Toggle + Skip) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Left: Brand Badge */}
        <View style={styles.brandBadge}>
          <View style={[styles.brandIconBox, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="restaurant" size={15} color={colors.primary} />
          </View>
          <View style={styles.brandBadgeCol}>
            <Text style={[styles.brandBadgeTitle, { fontFamily: fonts.bold }]}>
              {brand.appName}
            </Text>
            <Text style={[styles.brandBadgeSub, { fontFamily: fonts.semiBold }]}>
              ARTISAN KITCHEN
            </Text>
          </View>
        </View>

        {/* Right Controls: Atmosphere audio toggle + Skip */}
        <View style={styles.topRightControls}>
          <TouchableOpacity
            onPress={() => setIsMuted((prev) => !prev)}
            style={styles.soundToggleBtn}
            activeOpacity={0.7}
            accessibilityLabel={isMuted ? 'Unmute atmosphere' : 'Mute atmosphere'}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.soundToggleText, { fontFamily: fonts.semiBold }]}>
              {isMuted ? 'Muted' : 'Atmosphere'}
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: skipOpacity }} pointerEvents={isLast ? 'none' : 'auto'}>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              activeOpacity={0.7}
              accessibilityLabel="Skip Onboarding"
            >
              <Text style={[styles.skipText, { fontFamily: fonts.medium }]}>
                Skip
              </Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Horizontal Slides */}
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

      {/* Sticky Bottom Dock: Expanding pill dots, step counter, Gradient CTA, and Sign In */}
      <View
        style={[
          styles.bottomDock,
          {
            backgroundColor: isDark ? colors.card : colors.surface,
            borderTopColor: colors.subtleBorder,
            paddingBottom: Math.max(insets.bottom, 14) + 4,
          },
        ]}
      >
        {/* Pagination Dots & Step Counter */}
        <View style={styles.paginationRow}>
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

          {/* 01 / 03 Step Counter */}
          <Text
            style={[
              styles.stepCounterText,
              { color: colors.mutedText, fontFamily: fonts.semiBold },
            ]}
          >
            {`0${currentIndex + 1} / 0${slides.length}`}
          </Text>
        </View>

        {/* Gradient CTA Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.88}
          style={[styles.ctaButtonWrapper, shadows.buttonPrimary]}
          accessibilityLabel={isLast ? 'Enter Artisan Concierge' : 'Begin Artisan Journey'}
        >
          <SafeLinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaContentWrapper}>
              <Animated.View style={[styles.ctaRow, { opacity: nextOpacity }]}>
                <Text
                  style={[
                    styles.ctaText,
                    { color: colors.onPrimary, fontFamily: fonts.semiBold },
                  ]}
                >
                  Begin Artisan Journey
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.onPrimary}
                />
              </Animated.View>

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
                  Enter Artisan Concierge
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.onPrimary}
                />
              </Animated.View>
            </View>
          </SafeLinearGradient>
        </TouchableOpacity>

        {/* Already a Member? Sign in */}
        <View style={styles.signInRow}>
          <Text style={[styles.memberPrompt, { color: colors.mutedText, fontFamily: fonts.regular }]}>
            Already a Member?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.signInLink, { color: colors.primary, fontFamily: fonts.bold }]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 30,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeCol: {
    justifyContent: 'center',
  },
  brandBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    letterSpacing: 1.5,
    lineHeight: 14,
  },
  brandBadgeSub: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  soundToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    zIndex: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  stepCounterText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  ctaButtonWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
    letterSpacing: 0.2,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  memberPrompt: {
    fontSize: 12,
  },
  signInLink: {
    fontSize: 12,
  },
});
