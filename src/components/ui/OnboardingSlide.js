import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeLinearGradient } from '../../utils/SafeLinearGradient';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

const { width, height } = Dimensions.get('window');

export default function OnboardingSlide({
  item,
  index = 0,
  scrollX,
  isActive = false,
  reduceMotion = false,
}) {
  const { colors, typography, fonts, isDark } = useTheme();

  // Entrance animations for title & subtitle
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;

  // Title & Subtitle entrance on active slide
  useEffect(() => {
    if (isActive) {
      if (reduceMotion) {
        titleAnim.setValue(1);
        subAnim.setValue(1);
      } else {
        titleAnim.setValue(0);
        subAnim.setValue(0);
        const animation = Animated.stagger(80, [
          Animated.timing(titleAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(subAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        animation.start();
        return () => animation.stop();
      }
    } else {
      titleAnim.setValue(0);
      subAnim.setValue(0);
    }
  }, [isActive, reduceMotion, titleAnim, subAnim]);

  // Parallax interpolations
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageTranslateX =
    scrollX && !reduceMotion
      ? scrollX.interpolate({
          inputRange,
          outputRange: [width * 0.18, 0, -width * 0.18],
          extrapolate: 'clamp',
        })
      : 0;

  const heroContentTranslateX =
    scrollX && !reduceMotion
      ? scrollX.interpolate({
          inputRange,
          outputRange: [-width * 0.12, 0, width * 0.12],
          extrapolate: 'clamp',
        })
      : 0;

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* ─── TOP 52% CINEMATIC PHOTOGRAPHY & HERO ─── */}
      <View style={styles.heroWrapper}>
        {/* Photographic Background with slight parallax */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#1A0E0B',
              transform: [{ translateX: imageTranslateX }],
            },
          ]}
        >
          <Image
            source={{ uri: getOptimizedImageUrl(item.image) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Ambient Gradient Scrim (dark at top for header, dark in middle, transitions to sheet) */}
        <SafeLinearGradient
          colors={[
            'rgba(18, 5, 2, 0.65)',
            'rgba(18, 5, 2, 0.35)',
            'rgba(18, 5, 2, 0.85)',
            isDark ? '#1E1E1E' : '#FFFFFF',
          ]}
          locations={[0, 0.35, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating Hero Content */}
        <Animated.View
          style={[
            styles.heroContent,
            {
              transform: [{ translateX: heroContentTranslateX }],
            },
          ]}
        >
          {/* Top Pill Badges */}
          <View style={styles.pillRow}>
            {/* Pillar Badge */}
            <View style={styles.pillarBadge}>
              <View style={[styles.pillarDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.pillarText, { fontFamily: fonts.medium }]}>
                {item.pillar}
              </Text>
            </View>

            {/* VIP Concierge Badge */}
            <View style={styles.vipBadge}>
              <Ionicons
                name={item.badgeIcon || 'ribbon-outline'}
                size={13}
                color={colors.secondary}
              />
              <Text style={[styles.vipBadgeText, { fontFamily: fonts.semiBold }]}>
                {item.badge}
              </Text>
            </View>
          </View>

          {/* Category Tag */}
          <Text
            style={[
              styles.categoryTag,
              { color: colors.primary, fontFamily: fonts.bold },
            ]}
          >
            {item.category}
          </Text>

          {/* Hero Title */}
          <Animated.Text
            style={[
              styles.heroTitle,
              {
                fontFamily: fonts.bold,
                opacity: titleAnim,
              },
            ]}
            numberOfLines={2}
          >
            {item.heroTitle}
          </Animated.Text>

          {/* Hero Tagline */}
          <Animated.Text
            style={[
              styles.heroTagline,
              {
                fontFamily: fonts.regular,
                opacity: subAnim,
              },
            ]}
            numberOfLines={2}
          >
            {item.heroTagline}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* ─── BOTTOM 48% CURVED SHEET & 3 FEATURE TILES ─── */}
      <View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: isDark ? colors.card : colors.surface,
            borderColor: colors.subtleBorder,
          },
        ]}
      >
        {/* Handle Bar */}
        <View style={[styles.handleBar, { backgroundColor: colors.subtleBorder }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {/* Sheet Section Header */}
          <View style={styles.sheetHeader}>
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.textPrimary, fontFamily: fonts.bold },
              ]}
            >
              {item.sheetTitle}
            </Text>
            <Text
              style={[
                styles.sheetDescription,
                { color: colors.mutedText, fontFamily: fonts.regular },
              ]}
            >
              {item.sheetDescription}
            </Text>
          </View>

          {/* 3 Feature Checklist Tiles */}
          <View style={styles.featuresList}>
            {item.features?.map((feat, featIdx) => {
              // Alternate subtle tints for micro-diversity
              const tintBg =
                featIdx === 1
                  ? colors.pendingTint
                  : colors.primaryTint;
              const iconColor =
                featIdx === 1 ? colors.secondary : colors.primary;

              return (
                <View
                  key={`feat-${featIdx}`}
                  style={[
                    styles.featureTile,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FAFAFA',
                      borderColor: colors.subtleBorder,
                    },
                  ]}
                >
                  {/* Icon Box */}
                  <View
                    style={[
                      styles.featureIconBox,
                      { backgroundColor: tintBg },
                    ]}
                  >
                    <Ionicons name={feat.icon} size={18} color={iconColor} />
                  </View>

                  {/* Feature Text */}
                  <View style={styles.featureTextCol}>
                    <Text
                      style={[
                        styles.featureTitle,
                        { color: colors.textPrimary, fontFamily: fonts.semiBold },
                      ]}
                      numberOfLines={1}
                    >
                      {feat.title}
                    </Text>
                    <Text
                      style={[
                        styles.featureDesc,
                        { color: colors.mutedText, fontFamily: fonts.regular },
                      ]}
                      numberOfLines={1}
                    >
                      {feat.desc}
                    </Text>
                  </View>

                  {/* Checkmark */}
                  <Ionicons
                    name="checkmark-circle"
                    size={17}
                    color={colors.ready}
                    style={styles.featureCheckmark}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    height: '100%',
    flexDirection: 'column',
  },
  heroWrapper: {
    flex: 0.9,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    zIndex: 10,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  pillarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillarText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    letterSpacing: 0.3,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categoryTag: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 21,
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 4,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 6px rgba(0, 0, 0, 0.45)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  heroTagline: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  sheetContainer: {
    flex: 1.3,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 0,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetScrollContent: {
    paddingBottom: 115,
  },
  sheetHeader: {
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16.5,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  sheetDescription: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  featuresList: {
    gap: 7,
  },
  featureTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  featureTitle: {
    fontSize: 12,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 10.5,
  },
  featureCheckmark: {
    opacity: 0.9,
  },
});
