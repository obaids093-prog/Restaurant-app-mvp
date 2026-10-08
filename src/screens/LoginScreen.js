import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks/useForm';
import safeStorage from '../utils/safeStorage';

// Demo account emails for testing & grading convenience
const DEMO_ACCOUNTS = [
  {
    role: 'Customer',
    name: 'Zainab Malik',
    email: 'zainab.malik@aurabistro.pk',
  },
  {
    role: 'Manager',
    name: 'Chef Farhan Siddiqui',
    email: 'farhan.chef@aurabistro.pk',
  },
];

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme, shadows } = useTheme();
  const { login, signup } = useAuth();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState('login');
  const [rememberEmail, setRememberEmail] = useState(true);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission & server error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Input refs for smooth keyboard focus advancement
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Entrance animation
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Form validation function
  const validateForm = useCallback(
    (vals) => {
      const newErrors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasDigitRegex = /\d/;

      // Signup only: Full name
      if (mode === 'signup') {
        if (!vals.name || !vals.name.trim()) {
          newErrors.name = 'Full name is required.';
        } else if (vals.name.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters.';
        }
      }

      // Email validation (both modes)
      if (!vals.email || !vals.email.trim()) {
        newErrors.email = 'Email address is required.';
      } else if (!emailRegex.test(vals.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }

      // Password validation
      if (!vals.password) {
        newErrors.password = 'Password is required.';
      } else if (mode === 'signup') {
        if (vals.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters.';
        } else if (!hasDigitRegex.test(vals.password)) {
          newErrors.password = 'Password must contain at least one digit.';
        }

        // Confirm Password validation
        if (!vals.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password.';
        } else if (vals.password !== vals.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match.';
        }
      }

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
      email: '',
      password: '',
      confirmPassword: '',
    },
    validateForm
  );

  // Clear server error whenever any input is modified
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
    loadRememberedEmail();
  }, []);

  // Mode toggle: Login <-> Signup
  const handleToggleMode = (newMode) => {
    if (newMode === mode) return;
    setServerError(null);
    setMode(newMode);
    reset({
      name: '',
      email: values.email || '',
      password: '',
      confirmPassword: '',
    });
  };

  // Submit Handler
  const onFormValid = async (formValues) => {
    setIsSubmitting(true);
    setServerError(null);

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    try {
      const cleanEmail = formValues.email.trim().toLowerCase();

      if (mode === 'login') {
        const loggedUser = await login(cleanEmail, formValues.password);

        if (rememberEmail) {
          await safeStorage.setItem('@restaurant_last_email', cleanEmail);
        } else {
          await safeStorage.removeItem('@restaurant_last_email');
        }

        // Navigation decided by server-returned role
        if (loggedUser.role === 'manager') {
          navigation.navigate('ManagerDashboard');
        } else {
          navigation.navigate('CustomerApp', { screen: 'Menu' });
        }
      } else {
        // Public registration: ALWAYS role 'customer'
        await signup({
          name: formValues.name.trim(),
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

  const onSubmit = () => {
    handleFormSubmit(onFormValid);
  };

  // Live password rules status (matches server validation exactly)
  const isMinLength = (values.password || '').length >= 8;
  const hasDigit = /\d/.test(values.password || '');
  const isMatching =
    (values.confirmPassword || '').length > 0 && values.password === values.confirmPassword;

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Ambient background glow accents */}
      <View style={[styles.glowOrbTop, { backgroundColor: colors.primary + '18' }]} />
      <View style={[styles.glowOrbBottom, { backgroundColor: colors.primary + '10' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Theme Toggle */}
          <View style={styles.topUtilityRow}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.brandBadgeText, { color: colors.textSecondary }]}>
                AURA ARTISAN BISTRO
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeToggleBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
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

          {/* Hero Branding */}
          <View style={styles.heroSection}>
            <View style={styles.medallionWrapper}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.medallionRing}
              >
                <View
                  style={[styles.medallionCore, { backgroundColor: colors.card }]}
                >
                  <Ionicons name="sparkles" size={26} color="#f59e0b" />
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>AURA</Text>
            <Text style={[styles.brandSubtitle, { color: colors.primary }]}>
              MODERN ARTISAN KITCHEN & BOTANICA
            </Text>
            <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
              {mode === 'login'
                ? 'Welcome back. Sign in to reserve tables & dine.'
                : 'Create your guest account for exclusive dining.'}
            </Text>
          </View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                transform: [{ scale: cardScale }],
              },
              shadows.deep3D,
            ]}
          >
            {/* Header within Card */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {mode === 'login' ? 'Account Sign In' : 'Guest Registration'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                {mode === 'login'
                  ? 'Enter your credentials to continue'
                  : 'All guests register as dining patrons'}
              </Text>
            </View>

            {/* Server Error Inline Banner */}
            {serverError && (
              <View
                style={[
                  styles.serverErrorBanner,
                  {
                    backgroundColor: colors.errorBackground || 'rgba(239, 68, 68, 0.12)',
                    borderColor: colors.error,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.serverErrorText, { color: colors.error }]}>
                  {serverError}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Full Name (Signup Only) */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    FULL NAME
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: errors.name ? colors.error : colors.inputBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={nameInputRef}
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="e.g. Zainab Malik"
                      placeholderTextColor={colors.textMuted}
                      value={values.name}
                      onChangeText={(val) => handleChange('name', val)}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      editable={!isSubmitting}
                      accessibilityLabel="Full Name Input"
                    />
                  </View>
                  {errors.name ? (
                    <Text style={[styles.inlineError, { color: colors.error }]}>
                      {errors.name}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  EMAIL ADDRESS
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.email ? colors.error : colors.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={values.email}
                    onChangeText={(val) => handleChange('email', val)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    editable={!isSubmitting}
                    accessibilityLabel="Email Address Input"
                  />
                </View>
                {errors.email ? (
                  <Text style={[styles.inlineError, { color: colors.error }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  PASSWORD
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.password ? colors.error : colors.inputBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={values.password}
                    onChangeText={(val) => handleChange('password', val)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                    returnKeyType={mode === 'signup' ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      if (mode === 'signup') {
                        confirmPasswordInputRef.current?.focus();
                      } else {
                        onSubmit();
                      }
                    }}
                    editable={!isSubmitting}
                    accessibilityLabel="Password Input"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={[styles.inlineError, { color: colors.error }]}>
                    {errors.password}
                  </Text>
                ) : null}
              </View>

              {/* Confirm Password (Signup Only) */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    CONFIRM PASSWORD
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: errors.confirmPassword ? colors.error : colors.inputBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.textMuted}
                      value={values.confirmPassword}
                      onChangeText={(val) => handleChange('confirmPassword', val)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={onSubmit}
                      editable={!isSubmitting}
                      accessibilityLabel="Confirm Password Input"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      style={styles.eyeBtn}
                      accessibilityLabel={
                        showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={[styles.inlineError, { color: colors.error }]}>
                      {errors.confirmPassword}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Live Password Rules Checklist (Signup Only) */}
              {mode === 'signup' && (
                <View
                  style={[
                    styles.rulesCard,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.rulesHeader, { color: colors.textSecondary }]}>
                    PASSWORD REQUIREMENTS:
                  </Text>

                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={isMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={isMinLength ? colors.success : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        { color: isMinLength ? colors.success : colors.textMuted },
                      ]}
                    >
                      At least 8 characters
                    </Text>
                  </View>

                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={hasDigit ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={hasDigit ? colors.success : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        { color: hasDigit ? colors.success : colors.textMuted },
                      ]}
                    >
                      At least 1 numeric digit (0-9)
                    </Text>
                  </View>

                  <View style={styles.ruleRow}>
                    <Ionicons
                      name={isMatching ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={isMatching ? colors.success : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        { color: isMatching ? colors.success : colors.textMuted },
                      ]}
                    >
                      Passwords match
                    </Text>
                  </View>
                </View>
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
                      borderColor: rememberEmail ? colors.primary : colors.surfaceBorder,
                      backgroundColor: rememberEmail ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {rememberEmail && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                  Remember my email on this device
                </Text>
              </TouchableOpacity>

              {/* Submit CTA Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={isSubmitting}
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                    shadows.button3D,
                  ]}
                  activeOpacity={0.85}
                  accessibilityLabel={
                    mode === 'login' ? 'Sign In Button' : 'Create Account Button'
                  }
                >
                  {isSubmitting ? (
                    <View style={styles.submittingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        {mode === 'login' ? 'Verifying...' : 'Registering...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.submittingRow}>
                      <Text style={styles.submitButtonText}>
                        {mode === 'login' ? 'Sign In to AURA' : 'Create Customer Account'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Toggle Mode Link */}
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleQuestion, { color: colors.textMuted }]}>
                  {mode === 'login'
                    ? "Don't have an account?"
                    : 'Already have an account?'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleToggleMode(mode === 'login' ? 'signup' : 'login')}
                  style={styles.toggleBtn}
                  accessibilityLabel={
                    mode === 'login' ? 'Switch to Sign Up' : 'Switch to Sign In'
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleActionText, { color: colors.primary }]}>
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Test & Grading Credentials Reference Box */}
          <View
            style={[
              styles.demoCard,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.demoTitle, { color: colors.textPrimary }]}>
                Test Credentials (Seeded Accounts)
              </Text>
            </View>
            <Text style={[styles.demoNotice, { color: colors.textMuted }]}>
              Unified login detects your role automatically. Password is not prefilled.
            </Text>

            <View style={styles.demoChipsRow}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.email}
                  onPress={() => handleChange('email', acc.email)}
                  style={[
                    styles.demoChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel={`Fill email with ${acc.email}`}
                >
                  <View style={styles.demoChipInfo}>
                    <Text style={[styles.demoChipRole, { color: colors.primary }]}>
                      {acc.role}
                    </Text>
                    <Text style={[styles.demoChipEmail, { color: colors.textSecondary }]}>
                      {acc.email}
                    </Text>
                  </View>
                  <Ionicons name="clipboard-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
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
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  // Ambient glows
  glowOrbTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },

  // Top bar
  topUtilityRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 10,
    fontWeight: '800',
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

  // Hero section
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  medallionWrapper: {
    marginBottom: 10,
  },
  medallionRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },

  // Form Card
  formCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Server error banner
  serverErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  serverErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Fields container
  fieldsContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineError: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
  },

  // Live password checklist
  rulesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  rulesHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Remember row
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Submit button
  submitButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Toggle mode row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 6,
  },
  toggleQuestion: {
    fontSize: 13,
  },
  toggleBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleActionText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Demo credentials
  demoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  demoNotice: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 15,
  },
  demoChipsRow: {
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
  },
  demoChipInfo: {
    flex: 1,
  },
  demoChipRole: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  demoChipEmail: {
    fontSize: 12,
    fontWeight: '600',
  },
});
