/**
 * src/screens/OnboardingScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — 3-Slide Onboarding
 * Horizontal swipeable slides (FlatList) with dot indicators,
 * "Next" and "Get Started" buttons. Persists completion to
 * safeStorage so the user sees onboarding only once.
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { OnboardingSlide } from '../components/ui';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@aura_onboarding_complete';

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, fonts, shadows } = useTheme();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slides = brand.onboardingSlides;

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

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Mark onboarding as complete
      try {
        await safeStorage.setItem(ONBOARDING_KEY, 'true');
      } catch (e) {
        console.warn('Failed to persist onboarding state', e);
      }
      navigation.replace('Login');
    }
  }, [currentIndex, slides.length, navigation]);

  const handleSkip = useCallback(async () => {
    try {
      await safeStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.warn('Failed to persist onboarding state', e);
    }
    navigation.replace('Login');
  }, [navigation]);

  const isLast = currentIndex === slides.length - 1;

  const renderSlide = useCallback(
    ({ item, index }) => (
      <OnboardingSlide
        title={item.title}
        description={item.description}
        icon={item.icon}
        index={index}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Bar: Brand badge + Skip */}
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
      />

      {/* Bottom: Dots + CTA */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
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

        {/* CTA Button */}
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
          <Text
            style={[
              styles.ctaText,
              { color: colors.onPrimary, fontFamily: fonts.semiBold },
            ]}
          >
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={isLast ? 'arrow-forward' : 'chevron-forward'}
            size={18}
            color={colors.onPrimary}
          />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
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
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 380,
  },
  ctaText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  progressLabel: {
    fontSize: 12,
  },
});
