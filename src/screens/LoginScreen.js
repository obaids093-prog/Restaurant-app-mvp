/**
 * src/screens/LoginScreen.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Authentication Screen
 * Unified Login & Registration supporting Email/Password and
 * Pakistani Mobile OTP (Cheezious style).
 * Styled with HeroCard brand header, SegmentedControl, OtpInput,
 * theme design tokens, and zero hardcoded credentials or brand copy.
 * ═══════════════════════════════════════════════════════════
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks/useForm';
import safeStorage from '../utils/safeStorage';
import brand from '../config/brand';
import {
  Button,
  Input,
  PhoneInput,
  SegmentedControl,
  OtpInput,
} from '../components/ui';
import { SafeLinearGradient } from '../utils/SafeLinearGradient';

// Validation helpers
const validateSignupNameAndPhone = (vals, newErrors) => {
  const nameTrim = vals.name?.trim();
  if (!nameTrim) {
    newErrors.name = 'Full name is required.';
  } else if (nameTrim.length < 2) {
    newErrors.name = 'Name must be at least 2 characters.';
  }

  const pakPhoneClean = (vals.phone || '').replace(/\D/g, '');

  if (!pakPhoneClean) {
    newErrors.phone = 'Mobile number is required for order notifications.';
  } else if (!/^3\d{9}$/.test(pakPhoneClean)) {
    newErrors.phone = 'Enter a valid 10-digit Pakistani mobile number.';
  }
};

const validatePasswordFields = (vals, isSignup, newErrors) => {
  if (!vals.password) {
    newErrors.password = 'Password is required.';
    return;
  }
  if (!isSignup) return;

  if (vals.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters.';
  } else if (!/\d/.test(vals.password)) {
    newErrors.password = 'Password must contain at least one numeric digit.';
  }

  if (!vals.confirmPassword) {
    newErrors.confirmPassword = 'Please confirm your password.';
  } else if (vals.password !== vals.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match.';
  }
};

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, typography, fonts, radius, shadows } = useTheme();
  const {
    login,
    signup,
    sendPhoneOtp,
    verifyPhoneOtp,
    completePendingAuth,
    updateProfile,
  } = useAuth();

  // Mode: 0 = 'login', 1 = 'signup'
  const [selectedSegment, setSelectedSegment] = useState(0);
  const mode = selectedSegment === 0 ? 'login' : 'signup';

  const [rememberEmail, setRememberEmail] = useState(true);

  // Auth Method: 'email' (Email & Password) | 'phone' (Mobile OTP)
  const [authMethod, setAuthMethod] = useState('email');
  const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'otp' | 'nameEntry'
  const [otpValue, setOtpValue] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');

  // Submission & server error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);

  // Entrance animation: card slides up 16px and fades in over 300ms on mount
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;

  // Card shake animation on error (200ms)
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;

  // Theme toggle 180-degree rotation animation
  const themeRotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  // Ambient emblem breathing & slow orbit ring animations
  const emblemPulseAnim = useRef(new Animated.Value(1)).current;
  const orbitRotateAnim = useRef(new Animated.Value(0)).current;

  // Accessibility: reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(emblemPulseAnim, {
          toValue: 1.05,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(emblemPulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotateAnim, {
        toValue: 1,
        duration: 24000,
        useNativeDriver: true,
      })
    );
    orbitLoop.start();

    return () => {
      pulseLoop.stop();
      orbitLoop.stop();
    };
  }, [reduceMotion, emblemPulseAnim, orbitRotateAnim]);

  const orbitSpin = orbitRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Form validation function
  const validateForm = useCallback(
    (vals) => {
      const newErrors = {};
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

      if (mode === 'signup') {
        validateSignupNameAndPhone(vals, newErrors);
      }

      if (!vals.email?.trim()) {
        newErrors.email = 'Email address is required.';
      } else if (!emailRegex.test(vals.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }

      validatePasswordFields(vals, mode === 'signup', newErrors);

      return newErrors;
    },
    [mode]
  );

  const {
    values,
    errors,
    handleChange: originalHandleChange,
    handleSubmit: handleFormSubmit,
    reset,
  } = useForm(
    {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validateForm
  );

  // Clear server error whenever input changes
  const handleChange = (field, val) => {
    if (serverError) setServerError(null);
    originalHandleChange(field, val);
  };

  // Card shake helper triggered on validation/server errors (200ms)
  const triggerCardShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();

    errorFadeAnim.setValue(0);
    Animated.timing(errorFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [shakeAnim, errorFadeAnim]);

  // Restore remembered email on mount & card slide-up 16px entrance
  useEffect(() => {
    if (reduceMotion) {
      cardOpacity.setValue(1);
      cardTranslateY.setValue(0);
    } else {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await safeStorage.getItem('@restaurant_last_email');
        if (savedEmail) {
          handleChange('email', savedEmail);
        }
      } catch (err) {
        console.warn('Could not load remembered email', err);
      }
    };
    void loadRememberedEmail();
  }, [cardOpacity, cardTranslateY]);

  // Mode change handler via SegmentedControl
  const handleSegmentChange = (index) => {
    setSelectedSegment(index);
    setServerError(null);
    setPhoneError('');
    reset({
      name: '',
      phone: '',
      email: values.email || '',
      password: '',
      confirmPassword: '',
    });
  };

  // Navigate after brief checkmark success animation
  const navigateWithSuccess = (role) => {
    setIsAuthSuccess(true);
    setTimeout(() => {
      if (role === 'manager') {
        navigation.navigate('ManagerDashboard');
      } else {
        navigation.navigate('CustomerApp', { screen: 'Menu' });
      }
    }, 450);
  };

  // Submit Handler for Email/Password
  const onFormValid = async (formValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const cleanEmail = formValues.email.trim().toLowerCase();

      if (mode === 'login') {
        const loggedUser = await login(cleanEmail, formValues.password);

        if (rememberEmail) {
          await safeStorage.setItem('@restaurant_last_email', cleanEmail);
        } else {
          await safeStorage.removeItem('@restaurant_last_email');
        }

        navigateWithSuccess(loggedUser.role);
      } else {
        await signup({
          name: formValues.name.trim(),
          phone: formValues.phone ? formValues.phone.trim() : '',
          email: cleanEmail,
          password: formValues.password,
          role: 'customer',
        });

        if (rememberEmail) {
          await safeStorage.setItem('@restaurant_last_email', cleanEmail);
        }

        navigateWithSuccess('customer');
      }
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify your credentials.');
      triggerCardShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEmailForm = () => {
    handleFormSubmit((vals) => {
      onFormValid(vals);
    }, () => {
      triggerCardShake();
    });
  };

  // Phone OTP Flow Handlers
  const handleSendOtp = async () => {
    setPhoneError('');
    setServerError(null);

    const clean = phoneNumber.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(clean)) {
      setPhoneError('Enter a valid 10-digit Pakistani mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPhoneOtp(phoneNumber);
      setPhoneSuccessMsg(`SMS Code sent to ${res.phone || phoneNumber}`);
      setPhoneStep('otp');
    } catch (err) {
      setPhoneError(err.message || 'Failed to send OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setPhoneError('');
    setServerError(null);

    if (!otpValue || otpValue.trim().length < 4) {
      setPhoneError('Please enter the 4-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await verifyPhoneOtp({
        phone: phoneNumber,
        otp: otpValue,
        name: phoneName,
      });

      if (loggedUser.isNewUser) {
        setPendingUser(loggedUser);
        setPhoneName(phoneName ? phoneName.trim() : '');
        setPhoneStep('nameEntry');
      } else {
        navigateWithSuccess(loggedUser.role);
      }
    } catch (err) {
      setPhoneError(err.message || 'Invalid or expired OTP code.');
      triggerCardShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = async () => {
    setPhoneError('');
    setServerError(null);

    const trimmedName = (phoneName || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      setPhoneError('Please enter your full name (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile({ name: trimmedName });
      const activeUser = updatedUser || pendingUser || user;
      if (activeUser?.role === 'manager') {
        navigation.navigate('ManagerDashboard');
      } else {
        navigation.navigate('CustomerApp', { screen: 'Menu' });
      }
    } catch (err) {
      setPhoneError(err.message || 'Failed to save your name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipName = async () => {
    if (pendingUser && completePendingAuth) {
      setIsSubmitting(true);
      setPhoneError('');
      setServerError(null);
      try {
        await completePendingAuth(pendingUser);
        if (pendingUser.role === 'manager') {
          navigation.navigate('ManagerDashboard');
        } else {
          navigation.navigate('CustomerApp', { screen: 'Menu' });
        }
      } catch (err) {
        setPhoneError(err.message || 'Failed to complete authentication.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Password rules status for signup
  const isMinLength = (values.password || '').length >= 8;
  const hasDigit = /\d/.test(values.password || '');
  const isMatching =
    (values.confirmPassword || '').length > 0 && values.password === values.confirmPassword;

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════ SENIOR LUXURY BRAND CANOPY ══════════ */}
          <SafeLinearGradient
            colors={
              isDark
                ? ['#261510', '#1C0E0A', '#130805']
                : ['#FC5834', '#EB4F2B', '#D43C19']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.canopyContainer,
              {
                paddingTop: Math.max(insets.top, 16) + 10,
              },
            ]}
          >
            {/* Ambient Decorative Blurs & Concentric Arches */}
            <View
              style={[
                styles.ambientOrb1,
                {
                  backgroundColor: isDark
                    ? 'rgba(252, 88, 52, 0.16)'
                    : 'rgba(255, 255, 255, 0.16)',
                },
              ]}
            />
            <View
              style={[
                styles.ambientOrb2,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(255, 255, 255, 0.10)',
                },
              ]}
            />
            <View
              style={[
                styles.ambientArchRing,
                {
                  borderColor: isDark
                    ? 'rgba(245, 158, 11, 0.14)'
                    : 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            />

            {/* Top Utility Bar with Glassmorphic Artisan Guild & Theme Toggle */}
            <View style={styles.topUtilityRow}>
              <View style={styles.glassBadge}>
                <Ionicons
                  name="sparkles"
                  size={11}
                  color={isDark ? '#F59E0B' : '#FFF3B0'}
                />
                <Text style={styles.glassBadgeText}>ARTISAN KITCHEN</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const nextVal = isDark ? 0 : 1;
                  Animated.timing(themeRotateAnim, {
                    toValue: nextVal,
                    duration: 250,
                    useNativeDriver: true,
                  }).start();
                  toggleTheme();
                }}
                style={styles.themeToggleGlassBtn}
                accessibilityLabel="Toggle Theme"
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: themeRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name={isDark ? 'sunny' : 'moon'}
                    size={17}
                    color={isDark ? '#F59E0B' : '#FFFFFF'}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Center Artisan Emblem with Orbit Compass Ring */}
            <View style={styles.emblemContainer}>
              <Animated.View
                style={[
                  styles.orbitRing,
                  {
                    borderColor: isDark
                      ? 'rgba(245, 158, 11, 0.32)'
                      : 'rgba(255, 255, 255, 0.38)',
                    transform: [{ rotate: orbitSpin }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.orbitDiamond,
                    { top: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
                  ]}
                >
                  ✦
                </Text>
                <Text
                  style={[
                    styles.orbitDiamond,
                    { bottom: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
                  ]}
                >
                  ✦
                </Text>
                <Text
                  style={[
                    styles.orbitDiamond,
                    { left: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
                  ]}
                >
                  ✦
                </Text>
                <Text
                  style={[
                    styles.orbitDiamond,
                    { right: -7, color: isDark ? '#F59E0B' : '#FFFFFF' },
                  ]}
                >
                  ✦
                </Text>
              </Animated.View>

              {/* Glowing Squircle Center Emblem */}
              <Animated.View
                style={[
                  styles.emblemSquircle,
                  {
                    backgroundColor: isDark ? '#23130F' : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(252, 88, 52, 0.35)'
                      : 'rgba(255, 255, 255, 0.8)',
                    transform: [{ scale: emblemPulseAnim }],
                  },
                ]}
              >
                <Ionicons
                  name="restaurant"
                  size={26}
                  color={isDark ? '#FF6B4A' : '#FC5834'}
                />
              </Animated.View>
            </View>

            {/* Brand Title & Refined Subtitle Lockup */}
            <View style={styles.brandTitleBlock}>
              <Text style={styles.brandTitleText}>A U R A</Text>
              <View style={styles.taglineDividerRow}>
                <View style={styles.taglineDividerLine} />
                <Text style={styles.brandSubtitleText}>
                  ARTISAN KITCHEN & FINE DINING
                </Text>
                <View style={styles.taglineDividerLine} />
              </View>
            </View>
          </SafeLinearGradient>

          {/* ══════════ OVERLAPPING FORM SHEET ══════════ */}
          <View style={styles.formSheetWrapper}>
            {/* Auth Card Container: slides up 16px and fades in 300ms; shakes on error */}
            <Animated.View
              style={[
                styles.formCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderRadius: 24,
                  opacity: cardOpacity,
                  transform: [
                    { translateY: cardTranslateY },
                    { translateX: shakeAnim },
                  ],
                },
                shadows.cardLight,
              ]}
            >
            {/* Segmented Control for Login / Sign Up */}
            {phoneStep !== 'nameEntry' && (
              <SegmentedControl
                segments={['Sign In', 'Sign Up']}
                selectedIndex={selectedSegment}
                onChange={handleSegmentChange}
                style={styles.segmentedControl}
              />
            )}

            {/* Error & Info Banners */}
            {serverError ? (
              <Animated.View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.cancelledTint,
                    borderColor: colors.cancelled,
                    opacity: errorFadeAnim,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.cancelled} />
                <Text
                  style={[
                    styles.bannerText,
                    { color: colors.cancelled, fontFamily: fonts.medium },
                  ]}
                >
                  {serverError}
                </Text>
              </Animated.View>
            ) : null}

            {phoneError ? (
              <Animated.View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.cancelledTint,
                    borderColor: colors.cancelled,
                    opacity: errorFadeAnim,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.cancelled} />
                <Text
                  style={[
                    styles.bannerText,
                    { color: colors.cancelled, fontFamily: fonts.medium },
                  ]}
                >
                  {phoneError}
                </Text>
              </Animated.View>
            ) : null}

            {phoneSuccessMsg && phoneStep === 'otp' ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.successTint,
                    borderColor: colors.success,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text
                  style={[
                    styles.bannerText,
                    { color: colors.success, fontFamily: fonts.medium },
                  ]}
                >
                  {phoneSuccessMsg}
                </Text>
              </View>
            ) : null}

            {/* ══════════ EMAIL / PASSWORD FORM ══════════ */}
            {authMethod === 'email' ? (
              <View style={styles.fieldsContainer}>
                {mode === 'signup' && (
                  <>
                    <Input
                      label="Full Name"
                      value={values.name}
                      onChangeText={(val) => handleChange('name', val)}
                      placeholder="e.g. Zainab Malik"
                      error={errors.name}
                      icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
                      autoCapitalize="words"
                      editable={!isSubmitting}
                    />

                    <PhoneInput
                      value={values.phone}
                      onChangeText={(val) => handleChange('phone', val)}
                      error={errors.phone}
                      editable={!isSubmitting}
                    />
                  </>
                )}

                <Input
                  label="Email Address"
                  value={values.email}
                  onChangeText={(val) => handleChange('email', val)}
                  placeholder="name@example.com"
                  error={errors.email}
                  icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />

                <Input
                  label="Password"
                  value={values.password}
                  onChangeText={(val) => handleChange('password', val)}
                  placeholder="Enter your password"
                  error={errors.password}
                  icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
                  secureTextEntry={true}
                  editable={!isSubmitting}
                />

                {mode === 'signup' && (
                  <>
                    <Input
                      label="Confirm Password"
                      value={values.confirmPassword}
                      onChangeText={(val) => handleChange('confirmPassword', val)}
                      placeholder="Re-enter password"
                      error={errors.confirmPassword}
                      icon={
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color={colors.primary}
                        />
                      }
                      secureTextEntry={true}
                      editable={!isSubmitting}
                    />

                    {/* Live Password Rules Checklist */}
                    <View
                      style={[
                        styles.rulesCard,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.subtleBorder,
                          borderRadius: radius.input,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rulesHeader,
                          { color: colors.textSecondary, fontFamily: fonts.semiBold },
                        ]}
                      >
                        PASSWORD REQUIREMENTS:
                      </Text>

                      <View style={styles.ruleRow}>
                        <Ionicons
                          name={isMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                          size={15}
                          color={isMinLength ? colors.success : colors.mutedText}
                        />
                        <Text
                          style={[
                            styles.ruleText,
                            {
                              color: isMinLength ? colors.success : colors.mutedText,
                              fontFamily: fonts.regular,
                            },
                          ]}
                        >
                          At least 8 characters
                        </Text>
                      </View>

                      <View style={styles.ruleRow}>
                        <Ionicons
                          name={hasDigit ? 'checkmark-circle' : 'ellipse-outline'}
                          size={15}
                          color={hasDigit ? colors.success : colors.mutedText}
                        />
                        <Text
                          style={[
                            styles.ruleText,
                            {
                              color: hasDigit ? colors.success : colors.mutedText,
                              fontFamily: fonts.regular,
                            },
                          ]}
                        >
                          At least 1 numeric digit (0-9)
                        </Text>
                      </View>

                      <View style={styles.ruleRow}>
                        <Ionicons
                          name={isMatching ? 'checkmark-circle' : 'ellipse-outline'}
                          size={15}
                          color={isMatching ? colors.success : colors.mutedText}
                        />
                        <Text
                          style={[
                            styles.ruleText,
                            {
                              color: isMatching ? colors.success : colors.mutedText,
                              fontFamily: fonts.regular,
                            },
                          ]}
                        >
                          Passwords match
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Remember Email Checkbox */}
                <TouchableOpacity
                  onPress={() => setRememberEmail((prev) => !prev)}
                  style={styles.rememberRow}
                  activeOpacity={0.7}
                  accessibilityLabel="Remember Email Checkbox"
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: rememberEmail ? colors.primary : colors.border,
                        backgroundColor: rememberEmail ? colors.primary : 'transparent',
                        borderRadius: 6,
                      },
                    ]}
                  >
                    {rememberEmail && (
                      <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.rememberText,
                      { color: colors.textSecondary, fontFamily: fonts.regular },
                    ]}
                  >
                    Remember my email on this device
                  </Text>
                </TouchableOpacity>

                {/* Gradient Primary Button */}
                <Button
                  title={mode === 'login' ? `Sign In to ${brand.appName}` : 'Create Account'}
                  onPress={onSubmitEmailForm}
                  loading={isSubmitting && !isAuthSuccess}
                  success={isAuthSuccess}
                  variant="primary"
                  size="large"
                  icon={<Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />}
                  iconPosition="right"
                  style={styles.submitBtn}
                />

                {/* Link: Continue with Phone Number */}
                <TouchableOpacity
                  onPress={() => {
                    setAuthMethod('phone');
                    setServerError(null);
                    setPhoneError('');
                  }}
                  style={styles.switchAuthBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.switchAuthText,
                      { color: colors.primary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    Continue with phone number
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ══════════ MOBILE OTP FLOW ══════════ */
              <View style={styles.fieldsContainer}>
                {phoneStep === 'input' && (
                  <>
                    {mode === 'signup' && (
                      <Input
                        label="Your Name (Optional)"
                        value={phoneName}
                        onChangeText={setPhoneName}
                        placeholder="e.g. Zainab Malik"
                        icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
                        autoCapitalize="words"
                        editable={!isSubmitting}
                      />
                    )}

                    <PhoneInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      editable={!isSubmitting}
                    />

                    <Button
                      title="Send Verification Code"
                      onPress={handleSendOtp}
                      loading={isSubmitting}
                      variant="primary"
                      size="large"
                      icon={<Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />}
                      iconPosition="right"
                      style={styles.submitBtn}
                    />
                  </>
                )}

                {phoneStep === 'otp' && (
                  <>
                    <View style={styles.otpHeader}>
                      <Text
                        style={[
                          styles.otpTitle,
                          { color: colors.textPrimary, fontFamily: fonts.bold },
                        ]}
                      >
                        Enter 4-Digit Code
                      </Text>
                      <Text
                        style={[
                          styles.otpSubtitle,
                          { color: colors.mutedText, fontFamily: fonts.regular },
                        ]}
                      >
                        Code sent to {phoneNumber}
                      </Text>
                    </View>

                    {/* OtpInput Component */}
                    <OtpInput
                      code={otpValue}
                      length={4}
                      onCodeChange={setOtpValue}
                    />

                    <Button
                      title="Verify & Continue"
                      onPress={handleVerifyOtp}
                      loading={isSubmitting && !isAuthSuccess}
                      success={isAuthSuccess}
                      variant="primary"
                      size="large"
                      icon={<Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />}
                      iconPosition="right"
                      style={styles.submitBtn}
                    />

                    <View style={styles.otpActionsRow}>
                      <TouchableOpacity
                        onPress={() => setPhoneStep('input')}
                        style={styles.textBtn}
                      >
                        <Text
                          style={[
                            styles.textBtnLabel,
                            { color: colors.mutedText, fontFamily: fonts.medium },
                          ]}
                        >
                          Change Number
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleSendOtp} style={styles.textBtn}>
                        <Text
                          style={[
                            styles.textBtnLabel,
                            { color: colors.primary, fontFamily: fonts.semiBold },
                          ]}
                        >
                          Resend Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {phoneStep === 'nameEntry' && (
                  <>
                    <View style={styles.otpHeader}>
                      <Text
                        style={[
                          styles.otpTitle,
                          { color: colors.textPrimary, fontFamily: fonts.bold },
                        ]}
                      >
                        Welcome to {brand.appName}!
                      </Text>
                      <Text
                        style={[
                          styles.otpSubtitle,
                          { color: colors.mutedText, fontFamily: fonts.regular },
                        ]}
                      >
                        Enter your name to complete account setup
                      </Text>
                    </View>

                    <Input
                      label="Your Full Name"
                      value={phoneName}
                      onChangeText={setPhoneName}
                      placeholder="e.g. Syed Obaid Ali"
                      icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
                      autoCapitalize="words"
                      editable={!isSubmitting}
                    />

                    <Button
                      title={`Continue to ${brand.appName}`}
                      onPress={handleNameSubmit}
                      loading={isSubmitting}
                      variant="primary"
                      size="large"
                      style={styles.submitBtn}
                    />

                    <TouchableOpacity
                      onPress={handleSkipName}
                      disabled={isSubmitting}
                      style={styles.skipBtn}
                    >
                      <Text
                        style={[
                          styles.skipBtnText,
                          { color: colors.mutedText, fontFamily: fonts.medium },
                        ]}
                      >
                        Skip for now
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Link: Continue with Email & Password */}
                {phoneStep !== 'nameEntry' && (
                  <TouchableOpacity
                    onPress={() => {
                      setAuthMethod('email');
                      setServerError(null);
                      setPhoneError('');
                    }}
                    style={styles.switchAuthBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={16} color={colors.primary} />
                    <Text
                      style={[
                        styles.switchAuthText,
                        { color: colors.primary, fontFamily: fonts.semiBold },
                      ]}
                    >
                      Continue with email & password
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* Explore Onboarding Walkthrough */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.walkthroughLinkBtn}
            activeOpacity={0.75}
            accessibilityLabel="Explore Artisan Dining Experience"
          >
            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            <Text
              style={[
                styles.walkthroughLinkText,
                { color: colors.primary, fontFamily: fonts.semiBold },
              ]}
            >
              Explore Artisan Dining Pillars & Walkthrough
            </Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </TouchableOpacity>

          {/* Discreet Luxury Legal Notice */}
          <Text
            style={[
              styles.legalNoticeText,
              { color: colors.textSecondary, fontFamily: fonts.regular },
            ]}
          >
            By continuing, you agree to AURA's Terms of Dining and Privacy Charter.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
);
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    width: '100%',
  },
  canopyContainer: {
    width: '100%',
    paddingBottom: 54,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  ambientArchRing: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
  },
  topUtilityRow: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    zIndex: 10,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  glassBadgeText: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  themeToggleGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 86,
    height: 86,
    marginTop: 6,
    marginBottom: 10,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDiamond: {
    position: 'absolute',
    fontSize: 10,
    lineHeight: 12,
  },
  emblemSquircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitleBlock: {
    alignItems: 'center',
  },
  brandTitleText: {
    fontSize: 27,
    letterSpacing: 8,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  taglineDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  taglineDividerLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandSubtitleText: {
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    textAlign: 'center',
  },
  formSheetWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: -28,
  },
  formCard: {
    width: '100%',
    padding: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  legalNoticeText: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 16,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 16,
  },
  segmentedControl: {
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldsContainer: {
    width: '100%',
  },
  rulesCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  rulesHeader: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    minHeight: 44,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
  },
  submitBtn: {
    marginBottom: 16,
  },
  switchAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 10,
  },
  switchAuthText: {
    fontSize: 14,
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  textBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  textBtnLabel: {
    fontSize: 13,
  },
  skipBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 13,
  },
  walkthroughLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 88, 52, 0.08)',
  },
  walkthroughLinkText: {
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
});
