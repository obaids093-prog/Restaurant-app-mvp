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
  HeroCard,
  SegmentedControl,
  OtpInput,
} from '../components/ui';

// Validation helpers
const validateSignupNameAndPhone = (vals, newErrors) => {
  const nameTrim = vals.name?.trim();
  if (!nameTrim) {
    newErrors.name = 'Full name is required.';
  } else if (nameTrim.length < 2) {
    newErrors.name = 'Name must be at least 2 characters.';
  }

  const pakPhoneClean = (vals.phone || '').trim().replace(/[\s-]/g, '');
  const pakPhoneRegex = /^(\+92|0092|0)?3\d{9}$/;

  if (!vals.phone?.trim()) {
    newErrors.phone = 'Mobile number is required for order notifications.';
  } else if (!pakPhoneRegex.test(pakPhoneClean)) {
    newErrors.phone = 'Enter valid Pakistani mobile number (e.g. 0300-1234567).';
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

  // Entrance animation
  const cardScale = useRef(new Animated.Value(0.96)).current;

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

  // Restore remembered email on mount
  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

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
  }, []);

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

        if (loggedUser.role === 'manager') {
          navigation.navigate('ManagerDashboard');
        } else {
          navigation.navigate('CustomerApp', { screen: 'Menu' });
        }
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

        navigation.navigate('CustomerApp', { screen: 'Menu' });
      }
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEmailForm = () => {
    handleFormSubmit(onFormValid);
  };

  // Phone OTP Flow Handlers
  const handleSendOtp = async () => {
    setPhoneError('');
    setServerError(null);

    const clean = phoneNumber.trim().replace(/[\s-]/g, '');
    const pakRegex = /^(\+92|0092|0)?3\d{9}$/;
    if (!pakRegex.test(clean)) {
      setPhoneError('Enter a valid Pakistani mobile number (e.g. 0300-1234567).');
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
      } else if (loggedUser.role === 'manager') {
        navigation.navigate('ManagerDashboard');
      } else {
        navigation.navigate('CustomerApp', { screen: 'Menu' });
      }
    } catch (err) {
      setPhoneError(err.message || 'Invalid or expired OTP code.');
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
      await updateProfile({ name: trimmedName });
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Brand Badge & Theme Toggle */}
          <View style={styles.topUtilityRow}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
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
              onPress={toggleTheme}
              style={[
                styles.themeToggleBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder },
              ]}
              accessibilityLabel="Toggle Theme"
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Brand Header HeroCard with Gradient */}
          <HeroCard
            title={brand.appName}
            subtitle={brand.tagline}
            icon="flame"
            curvedBottom={true}
            style={styles.heroCard}
          />

          {/* Auth Card Container */}
          <Animated.View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: radius.card,
                transform: [{ scale: cardScale }],
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
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.cancelledTint,
                    borderColor: colors.cancelled,
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
              </View>
            ) : null}

            {phoneError ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.cancelledTint,
                    borderColor: colors.cancelled,
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
              </View>
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

                    <Input
                      label="Mobile Number"
                      value={values.phone}
                      onChangeText={(val) => handleChange('phone', val)}
                      placeholder="0300-1234567"
                      error={errors.phone}
                      icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
                      keyboardType="phone-pad"
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
                  loading={isSubmitting}
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

                    <Input
                      label="Mobile Number"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="0300-1234567"
                      icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
                      keyboardType="phone-pad"
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
                      loading={isSubmitting}
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
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topUtilityRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandBadgeText: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  themeToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    marginBottom: 20,
  },
  formCard: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
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
});
