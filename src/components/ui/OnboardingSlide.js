import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnboardingSlide({
  title,
  description,
  icon = 'restaurant-outline',
  index = 0,
  scrollX,
  isActive = false,
  reduceMotion = false,
}) {
  const { colors, typography, radius, fonts } = useTheme();

  // Entrance animations for title & subtitle (fade + 12px rise)
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;

  // Small looping motions for each slide illustration
  const tickAnim = useRef(new Animated.Value(0)).current;
  const steamAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

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
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(subAnim, {
            toValue: 1,
            duration: 250,
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

  // Looping illustration motion: started only when visible, stopped when not
  useEffect(() => {
    if (!isActive || reduceMotion) {
      tickAnim.setValue(0);
      steamAnim.setValue(0);
      pulseAnim.setValue(0);
      return;
    }

    let loop = null;

    if (index === 0) {
      // Slide 1: Ticking clock hand (360 deg rotation loop)
      loop = Animated.loop(
        Animated.timing(tickAnim, {
          toValue: 1,
          duration: 3600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else if (index === 1) {
      // Slide 2: Plate steam curve rising & fading
      loop = Animated.loop(
        Animated.timing(steamAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop.start();
    } else if (index === 2) {
      // Slide 3: Pulsing status dot & expanding halo
      loop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop.start();
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isActive, reduceMotion, index, tickAnim, steamAnim, pulseAnim]);

  // Parallax interpolations: illustration moves slightly slower than swipe, text moves faster
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const illustrationTranslateX =
    scrollX && !reduceMotion
      ? scrollX.interpolate({
          inputRange,
          outputRange: [width * 0.22, 0, -width * 0.22],
          extrapolate: 'clamp',
        })
      : 0;

  const textTranslateX =
    scrollX && !reduceMotion
      ? scrollX.interpolate({
          inputRange,
          outputRange: [-width * 0.14, 0, width * 0.14],
          extrapolate: 'clamp',
        })
      : 0;

  // Title & Subtitle translateY (12px rise)
  const titleTranslateY = reduceMotion
    ? 0
    : titleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      });

  const subTranslateY = reduceMotion
    ? 0
    : subAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      });

  // Clock hand rotation
  const clockRotate = tickAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Steam curve translateY & opacity
  const steamTranslateY = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -20],
  });
  const steamOpacity = steamAnim.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0, 0.75, 0.4, 0],
  });

  // Status pulse scale & opacity
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.6],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.7, 0.4, 0],
  });
  const dotPulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* Visual Composition / Illustration with Parallax */}
      <Animated.View
        style={[
          styles.illustrationOuter,
          {
            backgroundColor: colors.primaryTint,
            borderRadius: radius.card + 10,
            transform: [{ translateX: illustrationTranslateX }],
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
          {/* Slide 0: Ticking Clock Hand Dial */}
          {index === 0 && (
            <View style={[styles.dialContainer, { borderColor: colors.subtleBorder }]}>
              {/* Dial markings */}
              <View style={[styles.dialTickTop, { backgroundColor: colors.mutedText }]} />
              <View style={[styles.dialTickRight, { backgroundColor: colors.mutedText }]} />
              <View style={[styles.dialTickBottom, { backgroundColor: colors.mutedText }]} />
              <View style={[styles.dialTickLeft, { backgroundColor: colors.mutedText }]} />

              {/* Ticking Clock Hand Needle */}
              <Animated.View
                style={[
                  styles.clockHandWrapper,
                  {
                    transform: [{ rotate: clockRotate }],
                  },
                ]}
              >
                <View style={[styles.clockHandNeedle, { backgroundColor: colors.primary }]} />
              </Animated.View>

              {/* Center Hub */}
              <View style={[styles.dialCenterHub, { backgroundColor: colors.primary }]} />
            </View>
          )}

          {/* Slide 1: Gourmet Coupe Plate with Animated Steam Curve */}
          {index === 1 && (
            <View style={styles.plateContainer}>
              {/* Animated Steam Curves */}
              <Animated.View
                style={[
                  styles.steamCluster,
                  {
                    transform: [{ translateY: steamTranslateY }],
                    opacity: steamOpacity,
                  },
                ]}
              >
                <View style={[styles.steamCurve, styles.steamLeft, { borderColor: colors.primary }]} />
                <View style={[styles.steamCurve, styles.steamCenter, { borderColor: colors.secondary }]} />
                <View style={[styles.steamCurve, styles.steamRight, { borderColor: colors.primary }]} />
              </Animated.View>

              {/* Coupe Plate Rim & Base */}
              <View
                style={[
                  styles.plateBase,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.subtleBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.plateInner,
                    {
                      backgroundColor: colors.primaryTint,
                      borderColor: colors.subtleBorder,
                    },
                  ]}
                >
                  <Ionicons name="restaurant" size={24} color={colors.primary} />
                </View>
              </View>
            </View>
          )}

          {/* Slide 2: Live Kitchen Tracking with Pulsing Status Dot */}
          {index === 2 && (
            <View style={styles.radarContainer}>
              {/* Expanding Halo */}
              <Animated.View
                style={[
                  styles.radarHalo,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryTint,
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />

              {/* Core Pulsing Status Badge */}
              <Animated.View
                style={[
                  styles.radarCenter,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: dotPulseScale }],
                  },
                ]}
              >
                <Ionicons name="timer-outline" size={28} color={colors.onPrimary} />
              </Animated.View>

              {/* Status Ring Ping */}
              <View style={[styles.radarOuterRing, { borderColor: colors.subtleBorder }]} />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Text Group with Faster Parallax and Staggered Rise */}
      <Animated.View
        style={[
          styles.textGroup,
          {
            transform: [{ translateX: textTranslateX }],
          },
        ]}
      >
        <Animated.Text
          style={[
            typography.headingLg,
            styles.title,
            {
              color: colors.textPrimary,
              fontFamily: fonts.bold,
              opacity: titleAnim,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {title}
        </Animated.Text>

        <Animated.Text
          style={[
            typography.body,
            styles.description,
            {
              color: colors.mutedText,
              fontFamily: fonts.regular,
              opacity: subAnim,
              transform: [{ translateY: subTranslateY }],
            },
          ]}
        >
          {description}
        </Animated.Text>
      </Animated.View>
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
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  illustrationMiddle: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  textGroup: {
    alignItems: 'center',
    width: '100%',
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

  // Slide 0: Clock Dial styles
  dialContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialTickTop: {
    position: 'absolute',
    top: 6,
    width: 2,
    height: 8,
    borderRadius: 1,
  },
  dialTickBottom: {
    position: 'absolute',
    bottom: 6,
    width: 2,
    height: 8,
    borderRadius: 1,
  },
  dialTickLeft: {
    position: 'absolute',
    left: 6,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  dialTickRight: {
    position: 'absolute',
    right: 6,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  clockHandWrapper: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
  },
  clockHandNeedle: {
    width: 3,
    height: 35,
    borderRadius: 1.5,
  },
  dialCenterHub: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },

  // Slide 1: Plate & Steam styles
  plateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
  },
  steamCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    height: 36,
  },
  steamCurve: {
    width: 8,
    height: 24,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  steamLeft: {
    transform: [{ rotate: '-12deg' }],
    height: 20,
  },
  steamCenter: {
    transform: [{ rotate: '6deg' }],
    height: 28,
  },
  steamRight: {
    transform: [{ rotate: '-8deg' }],
    height: 22,
  },
  plateBase: {
    width: 120,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateInner: {
    width: 90,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Slide 2: Radar & Pulsing Status styles
  radarContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarOuterRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  radarHalo: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
  },
  radarCenter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
