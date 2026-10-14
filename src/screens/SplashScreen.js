/**
 * src/screens/SplashScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — "Cloche & Flame" Luxury Animated Splash
 * 
 * 0 to 400 ms:   Silver-style cloche dome lifts with a spring and tilts;
 *                flame emblem ignites underneath with spring scale and glow ring.
 * 400 to 800 ms: 3 steam curves and 6 spark dots drift upward and fade out.
 * 800 to 1100 ms:Letters of brand.appName appear one-by-one (60ms stagger),
 *                followed by tagline fade-in.
 * 3D Feel:       Multi-layer extrusion shadow, perspective tilt settling flat,
 *                and parallax background circles.
 * Finish:        Emblem scales down, slides up, screen cross-fades into next screen.
 * First Launch:  Full ~1.1s experience.
 * Later Launch:  Short version (~600ms, emblem & name only) via safeStorage.
 * Reduced Motion:Simple smooth cross-fade only via AccessibilityInfo.
 * ═══════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth, AUTH_USER_KEY } from '../context/AuthContext';
import { TOKEN_KEY } from '../api/client';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@aura_onboarding_complete';
const SPLASH_SEEN_KEY = '@aura_splash_seen';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, typography, fonts } = useTheme();
  const { user, token } = useAuth();

  const appLetters = useMemo(() => brand.appName.split(''), []);

  // Animation values (all opacity & transform using useNativeDriver: true)
  const masterFade = useRef(new Animated.Value(1)).current;
  const finishScale = useRef(new Animated.Value(1)).current;
  const finishTranslateY = useRef(new Animated.Value(0)).current;

  // Cloche lift & tilt
  const clocheLift = useRef(new Animated.Value(0)).current;
  const clocheTilt = useRef(new Animated.Value(0)).current;
  const clocheOpacity = useRef(new Animated.Value(1)).current;

  // Flame emblem & 3D tilt
  const emblemScale = useRef(new Animated.Value(0.1)).current;
  const emblemOpacity = useRef(new Animated.Value(0)).current;
  const emblemTilt = useRef(new Animated.Value(1)).current; // 1 -> 0 for flat settle
  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Steam & Sparks (400 - 800ms)
  const steamAnim = useRef(new Animated.Value(0)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;

  // App Name letters (one-by-one stagger)
  const letterAnims = useRef(appLetters.map(() => new Animated.Value(0))).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Parallax background circles
  const bgParallax = useRef(new Animated.Value(0)).current;

  // Thin progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Execute navigation safely
  const navigateNext = useRef(async () => {
    try {
      let activeUser = user;
      let activeToken = token;

      if (!activeUser || !activeToken) {
        const storedToken = await safeStorage.getItem(TOKEN_KEY);
        const storedUserRaw = await safeStorage.getItem(AUTH_USER_KEY);
        if (storedToken && storedUserRaw) {
          try {
            activeUser = JSON.parse(storedUserRaw);
            activeToken = storedToken;
          } catch {
            activeUser = null;
          }
        }
      }

      if (activeUser && activeToken) {
        if (activeUser.role === 'manager') {
          navigation.replace('ManagerDashboard');
        } else {
          navigation.replace('CustomerApp');
        }
        return;
      }

      const seen = await safeStorage.getItem(ONBOARDING_KEY);
      if (seen === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    } catch {
      navigation.replace('Login');
    }
  }).current;

  useEffect(() => {
    let isCancelled = false;
    let animRef = null;

    const runSequence = async () => {
      // 1. Accessibility: Check Reduce Motion
      let reduceMotion = false;
      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        reduceMotion = false;
      }

      // 2. Check if first launch or returning
      let isFirstLaunch = true;
      try {
        const hasSeenSplash = await safeStorage.getItem(SPLASH_SEEN_KEY);
        if (hasSeenSplash === 'true') {
          isFirstLaunch = false;
        } else {
          await safeStorage.setItem(SPLASH_SEEN_KEY, 'true');
        }
      } catch {
        isFirstLaunch = true;
      }

      if (isCancelled) return;

      // ─── MODE A: REDUCED MOTION ───────────────────────────────────────────
      if (reduceMotion) {
        emblemOpacity.setValue(1);
        emblemScale.setValue(1);
        letterAnims.forEach((a) => a.setValue(1));
        taglineOpacity.setValue(1);

        animRef = Animated.sequence([
          Animated.timing(masterFade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(100),
          Animated.timing(masterFade, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]);

        animRef.start(() => {
          if (!isCancelled) navigateNext();
        });
        return;
      }

      // ─── MODE B: SHORT LAUNCH (~600ms, Returning Users) ───────────────────
      if (!isFirstLaunch) {
        clocheOpacity.setValue(0);
        emblemOpacity.setValue(1);
        Animated.parallel([
          Animated.spring(emblemScale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          ...letterAnims.map((a) =>
            Animated.timing(a, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          ),
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ]).start();

        const timer = setTimeout(() => {
          if (isCancelled) return;
          Animated.parallel([
            Animated.timing(finishScale, {
              toValue: 0.88,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(finishTranslateY, {
              toValue: -24,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(masterFade, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (!isCancelled) navigateNext();
          });
        }, 500);

        return () => clearTimeout(timer);
      }

      // ─── MODE C: FULL "CLOCHE & FLAME" (~1100ms, First Launch) ───────────
      // Phase 1 (0 to 400 ms): Cloche lifts & tilts, flame emblem ignites underneath
      Animated.parallel([
        // Cloche rises and tilts slightly with spring
        Animated.spring(clocheLift, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(clocheTilt, {
          toValue: 1,
          friction: 6,
          tension: 35,
          useNativeDriver: true,
        }),
        Animated.timing(clocheOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),

        // Flame ignites underneath with spring scale
        Animated.timing(emblemOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(emblemScale, {
          toValue: 1,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),

        // Soft glow ring pulses once
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(glowScale, {
          toValue: 1.5,
          duration: 500,
          useNativeDriver: true,
        }),

        // Perspective 3D tilt settling to flat
        Animated.timing(emblemTilt, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),

        // Parallax background movement
        Animated.timing(bgParallax, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),

        // Progress bar
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1050,
          useNativeDriver: false,
        }),
      ]).start();

      // Phase 2 (400 to 800 ms): Steam curves and spark dots drift upward
      const timerPhase2 = setTimeout(() => {
        if (isCancelled) return;
        Animated.parallel([
          Animated.timing(steamAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(sparkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 350);

      // Phase 3 (800 to 1100 ms): Letters appear one by one (60ms each), then tagline fades in
      const timerPhase3 = setTimeout(() => {
        if (isCancelled) return;
        Animated.stagger(
          60,
          letterAnims.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 60,
              useNativeDriver: true,
            })
          )
        ).start(() => {
          if (isCancelled) return;
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }).start();
        });
      }, 720);

      // Finish (~1050ms): Emblem scales down, slides up, cross-fades into next screen
      const timerFinish = setTimeout(() => {
        if (isCancelled) return;
        Animated.parallel([
          Animated.timing(finishScale, {
            toValue: 0.88,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(finishTranslateY, {
            toValue: -26,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(masterFade, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (!isCancelled) navigateNext();
        });
      }, 1050);

      return () => {
        clearTimeout(timerPhase2);
        clearTimeout(timerPhase3);
        clearTimeout(timerFinish);
      };
    };

    const cleanupPromise = runSequence();

    return () => {
      isCancelled = true;
      if (animRef && typeof animRef.stop === 'function') {
        animRef.stop();
      }
      if (cleanupPromise && typeof cleanupPromise.then === 'function') {
        cleanupPromise.then((clean) => clean && clean());
      }
    };
  }, [
    navigation,
    user,
    token,
    appLetters,
    clocheLift,
    clocheTilt,
    clocheOpacity,
    emblemScale,
    emblemOpacity,
    emblemTilt,
    glowScale,
    glowOpacity,
    steamAnim,
    sparkAnim,
    letterAnims,
    taglineOpacity,
    bgParallax,
    progressAnim,
    finishScale,
    finishTranslateY,
    masterFade,
    navigateNext,
  ]);

  // Interpolated Transforms
  const clocheTranslateY = clocheLift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -68],
  });
  const clocheRotate = clocheTilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-14deg'],
  });

  const emblemRotateX = emblemTilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '18deg'],
  });
  const emblemRotateY = emblemTilt.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-15deg'],
  });

  // Parallax for the two large background ambient circles
  const bgTopTranslate = bgParallax.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });
  const bgBottomTranslate = bgParallax.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  // 3 Steam curves motion
  const steamTranslate1 = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -42],
  });
  const steamTranslate2 = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });
  const steamTranslate3 = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -38],
  });
  const steamOpacity = steamAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.75, 0],
  });

  // 6 Sparks motion
  const sparkDistance = sparkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -36],
  });
  const sparkOpacity = sparkAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.9, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          opacity: masterFade,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Ambient background decoration with slow parallax */}
      <Animated.View
        style={[
          styles.glowTopLeft,
          {
            backgroundColor: colors.onPrimary,
            opacity: 0.12,
            transform: [{ translateY: bgTopTranslate }, { translateX: bgTopTranslate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowBottomRight,
          {
            backgroundColor: colors.primaryPressed,
            opacity: 0.45,
            transform: [{ translateY: bgBottomTranslate }, { translateX: bgBottomTranslate }],
          },
        ]}
      />

      {/* Center Branding Content with Finish Animation Transform */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            paddingTop: insets.top,
            transform: [
              { scale: finishScale },
              { translateY: finishTranslateY },
            ],
          },
        ]}
      >
        {/* Emblem Stage: Cloche, Flame, Glow & Extrusion */}
        <View style={styles.stageWrapper}>
          {/* Soft Glow Ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: colors.onPrimary,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          {/* 3 Steam Curves drifting up */}
          <Animated.View
            style={[
              styles.steamCurve,
              {
                left: 28,
                opacity: steamOpacity,
                transform: [{ translateY: steamTranslate1 }, { rotate: '-8deg' }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.steamCurve,
              {
                left: 44,
                height: 22,
                opacity: steamOpacity,
                transform: [{ translateY: steamTranslate2 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.steamCurve,
              {
                left: 60,
                opacity: steamOpacity,
                transform: [{ translateY: steamTranslate3 }, { rotate: '8deg' }],
              },
            ]}
          />

          {/* 6 Small Spark Dots drifting outward */}
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 20,
                left: 18,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -12 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 14,
                left: 44,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -4 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 22,
                right: 18,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: 14 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 36,
                left: 14,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -16 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 40,
                right: 14,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: 16 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 52,
                left: 44,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: 6 }],
              },
            ]}
          />

          {/* Extruded 3D Layers behind Emblem */}
          <Animated.View
            style={[
              styles.emblemOuter,
              {
                position: 'absolute',
                top: 5,
                left: 3,
                opacity: emblemOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.2],
                }),
                transform: [
                  { perspective: 800 },
                  { rotateX: emblemRotateX },
                  { rotateY: emblemRotateY },
                  { scale: emblemScale },
                ],
              },
            ]}
          >
            <View style={[styles.emblemInner, { backgroundColor: '#000000' }]} />
          </Animated.View>

          <Animated.View
            style={[
              styles.emblemOuter,
              {
                position: 'absolute',
                top: 2.5,
                left: 1.5,
                opacity: emblemOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
                transform: [
                  { perspective: 800 },
                  { rotateX: emblemRotateX },
                  { rotateY: emblemRotateY },
                  { scale: emblemScale },
                ],
              },
            ]}
          >
            <View style={[styles.emblemInner, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          </Animated.View>

          {/* Main Flame Emblem (ignites underneath cloche) */}
          <Animated.View
            style={[
              styles.emblemOuter,
              {
                opacity: emblemOpacity,
                transform: [
                  { perspective: 800 },
                  { rotateX: emblemRotateX },
                  { rotateY: emblemRotateY },
                  { scale: emblemScale },
                ],
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

          {/* Silver-style Cloche Dome (rises and tilts away) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.clocheContainer,
              {
                opacity: clocheOpacity,
                transform: [
                  { translateY: clocheTranslateY },
                  { rotate: clocheRotate },
                ],
              },
            ]}
          >
            {/* Cloche Knob */}
            <View style={styles.clocheKnob} />
            <View style={styles.clocheStem} />

            {/* Cloche Dome Shell */}
            <View style={styles.clocheDome}>
              {/* Metallic highlight streak */}
              <View style={styles.clocheHighlight} />
            </View>

            {/* Cloche Serving Rim */}
            <View style={styles.clocheRim} />
          </Animated.View>
        </View>

        {/* Brand Wordmark (one-by-one animated letter reveal) */}
        <View style={styles.wordmarkRow}>
          {appLetters.map((char, index) => {
            const letterAnim = letterAnims[index];
            const translateY = letterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            });
            const scale = letterAnim.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0.6, 1.15, 1],
            });

            return (
              <Animated.Text
                key={`${char}-${index}`}
                style={[
                  styles.wordmarkLetter,
                  {
                    fontFamily: fonts.bold,
                    color: colors.onPrimary,
                    opacity: letterAnim,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                {char}
              </Animated.Text>
            );
          })}
        </View>

        {/* Brand Tagline */}
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
      </Animated.View>

      {/* Bottom subtle copyright / establishment */}
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
    </Animated.View>
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
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  stageWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  glowRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
  },
  emblemOuter: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  // Silver-Style Cloche Dome Styles (Views only, no images)
  clocheContainer: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  clocheKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E8ECF2',
    borderWidth: 1.5,
    borderColor: '#B4B9C4',
  },
  clocheStem: {
    width: 4,
    height: 5,
    backgroundColor: '#B4B9C4',
  },
  clocheDome: {
    width: 96,
    height: 48,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    backgroundColor: '#D4D8E2',
    borderWidth: 1.5,
    borderColor: '#9EA4B2',
    overflow: 'hidden',
  },
  clocheHighlight: {
    width: 70,
    height: 24,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignSelf: 'center',
    marginTop: 4,
  },
  clocheRim: {
    width: 106,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C2C6D2',
    borderWidth: 1.2,
    borderColor: '#8E94A2',
    marginTop: -1,
  },
  // Steam Curves
  steamCurve: {
    position: 'absolute',
    top: 8,
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  // Sparks
  sparkDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFE3A8',
  },
  // Wordmark letters
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  wordmarkLetter: {
    fontSize: 44,
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 2.6,
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
