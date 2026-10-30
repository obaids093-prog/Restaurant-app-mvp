import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useForm } from '../../hooks/useForm';
import safeStorage from '../../utils/safeStorage';
import { SegmentedControl } from '../../components/ui';

import {
  styles,
  validateSignupNameAndPhone,
  validatePasswordFields,
} from './loginStyles';
import BrandCanopy from './BrandCanopy';
import EmailPasswordForm from './EmailPasswordForm';
import PhoneOtpStep from './PhoneOtpStep';
import NameEntryStep from './NameEntryStep';
import GuestBrowseFooter from './GuestBrowseFooter';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, fonts, radius, shadows } = useTheme();
  const {
    user,
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
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
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
      } else if (mode === 'signup' && !vals.email.trim().toLowerCase().endsWith('@gmail.com')) {
        newErrors.email = 'Only Gmail accounts (@gmail.com) are accepted.';
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
    handleFormSubmit(
      (vals) => {
        void onFormValid(vals);
      },
      () => {
        triggerCardShake();
      }
    );
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

    if (!otpValue || otpValue.trim().length < 6) {
      setPhoneError('Please enter the 6-digit verification code.');
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
          {/* Brand Canopy Header */}
          <BrandCanopy
            insets={insets}
            isDark={isDark}
            themeRotateAnim={themeRotateAnim}
            toggleTheme={toggleTheme}
            orbitSpin={orbitSpin}
            emblemPulseAnim={emblemPulseAnim}
          />

          {/* Form Sheet Wrapper */}
          <View style={styles.formSheetWrapper}>
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
              {/* Segmented Control */}
              {phoneStep !== 'nameEntry' && (
                <SegmentedControl
                  segments={['Sign In', 'Sign Up']}
                  selectedIndex={selectedSegment}
                  onChange={handleSegmentChange}
                  style={styles.segmentedControl}
                />
              )}

              {/* Error Banners */}
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

              {/* Form Content */}
              {authMethod === 'email' ? (
                <EmailPasswordForm
                  mode={mode}
                  values={values}
                  errors={errors}
                  handleChange={handleChange}
                  rememberEmail={rememberEmail}
                  setRememberEmail={setRememberEmail}
                  isSubmitting={isSubmitting}
                  isAuthSuccess={isAuthSuccess}
                  onSubmitEmailForm={onSubmitEmailForm}
                  setAuthMethod={setAuthMethod}
                  setServerError={setServerError}
                  setPhoneError={setPhoneError}
                  colors={colors}
                  fonts={fonts}
                  radius={radius}
                />
              ) : phoneStep === 'nameEntry' ? (
                <NameEntryStep
                  phoneName={phoneName}
                  setPhoneName={setPhoneName}
                  isSubmitting={isSubmitting}
                  handleNameSubmit={handleNameSubmit}
                  handleSkipName={handleSkipName}
                  colors={colors}
                  fonts={fonts}
                />
              ) : (
                <PhoneOtpStep
                  phoneStep={phoneStep}
                  setPhoneStep={setPhoneStep}
                  mode={mode}
                  phoneName={phoneName}
                  setPhoneName={setPhoneName}
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  otpValue={otpValue}
                  setOtpValue={setOtpValue}
                  isSubmitting={isSubmitting}
                  isAuthSuccess={isAuthSuccess}
                  handleSendOtp={handleSendOtp}
                  handleVerifyOtp={handleVerifyOtp}
                  setAuthMethod={setAuthMethod}
                  setServerError={setServerError}
                  setPhoneError={setPhoneError}
                  colors={colors}
                  fonts={fonts}
                />
              )}
            </Animated.View>

            {/* Guest Browse Footer */}
            <GuestBrowseFooter
              navigation={navigation}
              colors={colors}
              fonts={fonts}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
