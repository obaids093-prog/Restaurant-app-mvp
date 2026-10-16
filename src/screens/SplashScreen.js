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
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  AccessibilityInfo,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth, AUTH_USER_KEY } from '../context/AuthContext';
import { TOKEN_KEY } from '../api/client';
import brand from '../config/brand';
import safeStorage from '../utils/safeStorage';
import { SafeLinearGradient } from '../utils/SafeLinearGradient';

const ONBOARDING_KEY = '@aura_onboarding_complete';
const SPLASH_SEEN_KEY = '@aura_splash_seen';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, fonts, isDark } = useTheme();
  const { user, token } = useAuth();

  const appLetters = useMemo(() => brand.appName.split(''), []);
  const activeLocationsText = useMemo(() => {
    const list = (brand.outlets || []).filter((o) => o.isActive !== false);
    if (list.length === 0) return 'FINE DINING';
    return list.map((o) => o.city.toUpperCase()).join(' • ');
  }, []);

  // Animation values (all opacity & transform using useNativeDriver: true)
  const masterFade = useRef(new Animated.Value(1)).current;
  const finishScale = useRef(new Animated.Value(1)).current;
  const finishTranslateY = useRef(new Animated.Value(0)).current;

  // Cloche lift & tilt
  const clocheLift = useRef(new Animated.Value(0)).current;
  const clocheTilt = useRef(new Animated.Value(0)).current;
  const clocheOpacity = useRef(new Animated.Value(1)).current;

  // Orbit ring rotation continuous loop
  const ringRotation = useRef(new Animated.Value(0)).current;

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

      // Real-World Standard: Only show onboarding on first-ever launch
      const hasSeenOnboarding = await safeStorage.getItem(ONBOARDING_KEY);
      if (hasSeenOnboarding === 'true') {
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

  // Start loops for orbit ring
  useEffect(() => {
    const ringLoop = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    ringLoop.start();

    return () => {
      ringLoop.stop();
    };
  }, [ringRotation]);

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

  const ringRotateDeg = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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

  const bgGradientColors = isDark
    ? ['#1C0B06', '#120502', '#0A0301']
    : [colors.primary, colors.primaryPressed, '#1C0B06'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#120502' : colors.primary,
          opacity: masterFade,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#120502' : colors.primary} />

      {/* Luxury Background Gradient Scrim */}
      <SafeLinearGradient
        colors={bgGradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glowing vignette halos */}
      <Animated.View
        style={[
          styles.glowTopLeft,
          {
            backgroundColor: '#FFFFFF',
            opacity: isDark ? 0.08 : 0.16,
            transform: [{ translateY: bgTopTranslate }, { translateX: bgTopTranslate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowBottomRight,
          {
            backgroundColor: colors.primary,
            opacity: isDark ? 0.35 : 0.5,
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
        {/* Emblem Stage: Rotating Orbit, Cloche, Flame, Steam */}
        <View style={styles.stageWrapper}>
          {/* Rotating Outer Dashed Orbit Ring with Compass Accents */}
          <Animated.View
            style={[
              styles.orbitRing,
              {
                borderColor: 'rgba(255, 255, 255, 0.25)',
                transform: [{ rotate: ringRotateDeg }],
              },
            ]}
          >
            <View style={[styles.orbitAccent, styles.orbitAccentTop]} />
            <View style={[styles.orbitAccent, styles.orbitAccentRight]} />
            <View style={[styles.orbitAccent, styles.orbitAccentBottom]} />
            <View style={[styles.orbitAccent, styles.orbitAccentLeft]} />
          </Animated.View>

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
                left: 36,
                opacity: steamOpacity,
                transform: [{ translateY: steamTranslate1 }, { rotate: '-8deg' }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.steamCurve,
              {
                left: 54,
                height: 24,
                opacity: steamOpacity,
                transform: [{ translateY: steamTranslate2 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.steamCurve,
              {
                left: 72,
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
                top: 24,
                left: 24,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -12 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 18,
                left: 54,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -4 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 26,
                right: 24,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: 14 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 42,
                left: 18,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: -16 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 46,
                right: 18,
                opacity: sparkOpacity,
                transform: [{ translateY: sparkDistance }, { translateX: 16 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sparkDot,
              {
                top: 58,
                left: 54,
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
                top: 28,
                left: 27,
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

        {/* Brand Subtitle */}
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
          ARTISAN KITCHEN & FINE DINING
        </Animated.Text>

        {/* Geographic Divider Badge */}
        <Animated.View
          style={[
            styles.locationDividerRow,
            {
              opacity: taglineOpacity,
            },
          ]}
        >
          <View style={styles.locationLine} />
          <Text style={[styles.locationText, { color: colors.onPrimary, fontFamily: fonts.medium }]}>
            {activeLocationsText}
          </Text>
          <View style={styles.locationLine} />
        </Animated.View>
      </Animated.View>

      {/* Sleek Minimalist Loading & Brand Imprint */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 28 }]}>
        {/* Sleek Minimal Progress Track */}
        <View style={styles.minimalProgressTrack}>
          <Animated.View
            style={[
              styles.minimalProgressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <SafeLinearGradient
              colors={['#FFFFFF', '#FFE3A8', '#FC5834']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Subtle Brand Imprint */}
        <Animated.Text
          style={[
            styles.brandCreditText,
            {
              color: colors.onPrimary,
              fontFamily: fonts.medium,
              opacity: taglineOpacity,
            },
          ]}
        >
          {brand.restaurantName.toUpperCase()}
        </Animated.Text>
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
    paddingHorizontal: 28,
    width: '100%',
  },
  stageWrapper: {
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitAccent: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
  orbitAccentTop: {
    top: -3,
  },
  orbitAccentRight: {
    right: -3,
  },
  orbitAccentBottom: {
    bottom: -3,
  },
  orbitAccentLeft: {
    left: -3,
  },
  glowRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
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
  clocheContainer: {
    position: 'absolute',
    top: 22,
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
  steamCurve: {
    position: 'absolute',
    top: 18,
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  sparkDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFE3A8',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  wordmarkLetter: {
    fontSize: 42,
    letterSpacing: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2.8,
    textAlign: 'center',
    maxWidth: 290,
    opacity: 0.9,
    marginBottom: 8,
  },
  locationDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  locationLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    fontSize: 9.5,
    letterSpacing: 2.2,
    opacity: 0.75,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  minimalProgressTrack: {
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  minimalProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  brandCreditText: {
    fontSize: 10,
    letterSpacing: 2.2,
    textAlign: 'center',
    opacity: 0.75,
  },
});
