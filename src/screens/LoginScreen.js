import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../utils/SafeLinearGradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks/useForm';

// Seeded VIP demo profiles (Question 6 & 5 specs)
const DEMO_PROFILES = {
  customer: {
    email: 'zainab.malik@aurabistro.pk',
    password: 'Password123',
    role: 'customer',
  },
  manager: {
    email: 'farhan.chef@aurabistro.pk',
    password: 'Admin1234',
    role: 'manager',
  },
};

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  // Theme & Auth Context
  const { colors, isDark, toggleTheme, shadows } = useTheme();
  const { login, signup } = useAuth();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState('login');
  // Selected user role for active session context: 'customer' | 'manager'
  const [activeRoleTab, setActiveRoleTab] = useState('customer');
  const [rememberMe, setRememberMe] = useState(true);

  // Form validation using custom useForm hook
  const validateForm = useCallback(
    (vals) => {
      const newErrors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasDigitRegex = /\d/;

      // Email validation
      if (!vals.email || !vals.email.trim()) {
        newErrors.email = 'Identity email address is required.';
      } else if (!emailRegex.test(vals.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }

      // Password validation (min 8 chars, at least 1 digit)
      if (!vals.password) {
        newErrors.password = 'Passcode is required.';
      } else if (vals.password.length < 8) {
        newErrors.password = 'Passcode must be at least 8 characters long.';
      } else if (!hasDigitRegex.test(vals.password)) {
        newErrors.password = 'Passcode must include at least one numeric digit.';
      }

      // Signup-only validations
      if (mode === 'signup') {
        if (!vals.name || !vals.name.trim()) {
          newErrors.name = 'Full patron name is required.';
        }

        if (!vals.confirmPassword) {
          newErrors.confirmPassword = 'Please verify your passcode.';
        } else if (vals.password !== vals.confirmPassword) {
          newErrors.confirmPassword = 'Security passcodes do not match.';
        }
      }

      return newErrors;
    },
    [mode]
  );

  const {
    values,
    errors,
    handleChange,
    handleSubmit: handleFormSubmit,
    reset,
    setValues,
  } = useForm(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
    },
    validateForm
  );

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const roleSlideAnim = useRef(new Animated.Value(0)).current; // 0: customer, 1: manager
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRoleTabSwitch = (role) => {
    setActiveRoleTab(role);
    handleChange('role', role);
    Animated.spring(roleSlideAnim, {
      toValue: role === 'customer' ? 0 : 1,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();

    // Auto switch to appropriate demo profile if needed
    if (role === 'manager') {
      autofillUser(DEMO_PROFILES.manager, 'manager');
    } else {
      autofillUser(DEMO_PROFILES.customer, 'diner');
    }
  };

  const handleToggleMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    reset({
      name: '',
      email: values.email || '',
      password: '',
      confirmPassword: '',
      role: activeRoleTab,
    });
  };

  // Quick autofill for VIP profiles
  const autofillUser = (presetUser, passKey) => {
    setSelectedPass(passKey);
    handleChange('email', presetUser.email);
    handleChange('password', presetUser.password);
    handleChange('role', presetUser.role || 'customer');
    if (presetUser.role === 'manager') {
      setActiveRoleTab('manager');
      Animated.spring(roleSlideAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: false }).start();
    } else {
      setActiveRoleTab('customer');
      Animated.spring(roleSlideAnim, { toValue: 0, friction: 7, tension: 50, useNativeDriver: false }).start();
    }
  };

  // Submit Handler
  const onFormValid = async (formValues) => {
    setIsSubmitting(true);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    try {
      if (mode === 'login') {
        const loggedUser = await login(formValues.email, formValues.password);
        if (loggedUser.role === 'manager') {
          navigation.navigate('ManagerDashboard');
        } else {
          navigation.navigate('CustomerApp', { screen: 'Menu' });
        }
      } else {
        const newUser = await signup({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role || activeRoleTab,
        });
        Alert.alert('Patron Account Created', `Welcome to AURA, ${newUser.name}! Your bespoke seat awaits.`);
        if (newUser.role === 'manager') {
          navigation.navigate('ManagerDashboard');
        } else {
          navigation.navigate('CustomerApp', { screen: 'Menu' });
        }
      }
    } catch (err) {
      Alert.alert(
        'Authentication Error',
        err.message || 'Unable to authenticate credentials with the AURA registry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    handleFormSubmit(onFormValid);
  };

  const roleIndicatorTranslate = roleSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, (width > 420 ? 380 : width - 48) / 2],
  });

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Subtle Ambient Glow Orbs from Stitch Design */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowRight} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Theme Toggle */}
          <View style={styles.topUtilityRow}>
            <View style={styles.vipLiveTag}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.vipLiveText}>PRIVATE CELLAR EDITION</Text>
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeToggleBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
              ]}
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Hero Branding Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoMedallionContainer}>
              <View style={styles.logoMedallionGlow} />
              <LinearGradient
                colors={['#f59e0b', '#ffc174']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoMedallionRing}
              >
                <View style={styles.logoMedallionCore}>
                  <Ionicons name="sparkles" size={26} color="#f59e0b" />
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.brandTitle}>AURA</Text>
            <Text style={styles.brandSubtitle}>MODERN ARTISAN KITCHEN & BOTANICA</Text>
          </View>

          {/* Role Switcher Segmented Pill */}
          <View style={styles.roleSwitcherContainer}>
            <View style={styles.roleSwitcherTrack}>
              <Animated.View
                style={[
                  styles.roleSlidingIndicator,
                  {
                    transform: [{ translateX: roleIndicatorTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#f59e0b', '#ffc174']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.roleIndicatorGradient}
                />
              </Animated.View>

              <TouchableOpacity
                onPress={() => handleRoleTabSwitch('customer')}
                style={styles.roleTabButton}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.roleTabText,
                    activeRoleTab === 'customer'
                      ? styles.roleTabTextActive
                      : styles.roleTabTextInactive,
                  ]}
                >
                  Customer Dining
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRoleTabSwitch('manager')}
                style={styles.roleTabButton}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.roleTabText,
                    activeRoleTab === 'manager'
                      ? styles.roleTabTextActive
                      : styles.roleTabTextInactive,
                  ]}
                >
                  Restaurant Manager
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Login Glassmorphic Card */}
          <Animated.View
            style={[
              styles.loginCard,
              {
                backgroundColor: colors.surface + 'EE',
                borderColor: colors.cardBorder,
                transform: [{ scale: cardScale }],
              },
              shadows.deep3D,
            ]}
          >
            {/* Mode Switcher inside card: Sign In / Register */}
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                onPress={() => handleToggleMode('login')}
                style={[
                  styles.modeTab,
                  mode === 'login' && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'login' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textMuted },
                  ]}
                >
                  Keycard Sign In
                </Text>
                {mode === 'login' && <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleToggleMode('signup')}
                style={[
                  styles.modeTab,
                  mode === 'signup' && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'signup' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textMuted },
                  ]}
                >
                  New Membership
                </Text>
                {mode === 'signup' && <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            </View>

            {/* Role Hint Text */}
            <Text style={styles.roleHintText}>
              {activeRoleTab === 'customer'
                ? 'Access your bespoke reservations & tasting diary'
                : 'Direct kitchen pass, cellar ledger & shift orchestration'}
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Full Name for Signup */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PATRON NAME</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      errors.name ? styles.inputFieldError : null,
                    ]}
                  >
                    <Ionicons name="person-outline" size={18} color="#ffc174" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Julianna Vance"
                      placeholderTextColor="#a08e7a"
                      value={values.name}
                      onChangeText={(val) => handleChange('name', val)}
                      autoCapitalize="words"
                      editable={!isSubmitting}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
              )}

              {/* Email / Identity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IDENTITY</Text>
                <View
                  style={[
                    styles.inputFieldBox,
                    errors.email ? styles.inputFieldError : null,
                  ]}
                >
                  <Ionicons name="mail-outline" size={18} color="#ffc174" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      activeRoleTab === 'customer'
                        ? 'VIP Pass ID or Email'
                        : 'Sommelier or Executive Badge ID'
                    }
                    placeholderTextColor="#a08e7a"
                    value={values.email}
                    onChangeText={(val) => handleChange('email', val)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Passcode / Security Key */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSCODE</Text>
                <View
                  style={[
                    styles.inputFieldBox,
                    errors.password ? styles.inputFieldError : null,
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={18} color="#ffc174" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { paddingRight: 40 }]}
                    placeholder="Security Key"
                    placeholderTextColor="#a08e7a"
                    value={values.password}
                    onChangeText={(val) => handleChange('password', val)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#d8c3ad"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password for Signup */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM PASSCODE</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      errors.confirmPassword ? styles.inputFieldError : null,
                    ]}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color="#ffc174" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { paddingRight: 40 }]}
                      placeholder="Verify Security Key"
                      placeholderTextColor="#a08e7a"
                      value={values.confirmPassword}
                      onChangeText={(val) => handleChange('confirmPassword', val)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIconBtn}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#d8c3ad"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>
              )}

              {/* Meta Row: Remember Session & Forgot Key */}
              <View style={styles.metaRow}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.rememberMeGroup}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.customCheckbox,
                      rememberMe && styles.customCheckboxActive,
                    ]}
                  >
                    {rememberMe && <Ionicons name="checkmark" size={12} color="#472a00" />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember session</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Security Protocol',
                      'Please present your physical reservation card or contact the maître d\' at the sanctuary host stand.'
                    )
                  }
                >
                  <Text style={styles.forgotKeyText}>Forgot Key?</Text>
                </TouchableOpacity>
              </View>

              {/* High-Glow Primary CTA Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.9}
                  style={styles.ctaButtonWrapper}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#ffc174']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaButtonGradient}
                  >
                    {isSubmitting ? (
                      <View style={styles.ctaContentRow}>
                        <ActivityIndicator size="small" color="#472a00" />
                        <Text style={styles.ctaButtonText}>Authenticating...</Text>
                      </View>
                    ) : (
                      <View style={styles.ctaContentRow}>
                        <Text style={styles.ctaButtonText}>
                          {mode === 'login' ? 'Enter AURA' : 'Create Dining Membership'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#472a00" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider: Or Access Via */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR ACCESS VIA</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social VIP Authentication Pills */}
              <View style={styles.socialAuthGrid}>
                <TouchableOpacity
                  style={styles.socialPill}
                  onPress={() => autofillUser(DEMO_PROFILES.customer, 'diner')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-apple" size={16} color="#dfe2ee" />
                  <Text style={styles.socialPillText}>Apple VIP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialPill}
                  onPress={() => autofillUser(DEMO_PROFILES.manager, 'manager')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={16} color="#dfe2ee" />
                  <Text style={styles.socialPillText}>Google Key</Text>
                </TouchableOpacity>
              </View>

              {/* One-Touch VIP Fast-Pass Demo Deck */}
              <View style={styles.fastPassSection}>
                <View style={styles.fastPassHeader}>
                  <Ionicons name="key" size={13} color="#ffc174" />
                  <Text style={styles.fastPassTitle}>ONE-TOUCH VIP DEMO PASSES</Text>
                </View>

                <View style={styles.fastPassRow}>
                  <TouchableOpacity
                    onPress={() => autofillUser(DEMO_PROFILES.customer, 'diner')}
                    style={[
                      styles.fastPassCard,
                      selectedPass === 'diner' && styles.fastPassCardActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.passBadgeGreen}>
                      <Text style={styles.passBadgeGreenText}>PATRON</Text>
                    </View>
                    <Text style={styles.passCardName}>Zainab Malik</Text>
                    <Text style={styles.passCardRole}>Diner Access</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => autofillUser(DEMO_PROFILES.manager, 'manager')}
                    style={[
                      styles.fastPassCard,
                      selectedPass === 'manager' && styles.fastPassCardActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.passBadgeGold}>
                      <Text style={styles.passBadgeGoldText}>EXECUTIVE</Text>
                    </View>
                    <Text style={styles.passCardName}>Chef Farhan</Text>
                    <Text style={styles.passCardRole}>Operations GM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Culinary Guild Charter Footer */}
          <View style={styles.footerCharter}>
            <Text style={styles.footerCharterText}>
              By entering, you accept AURA Culinary Guild Privileges & Private Dining Charter.
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
    alignItems: 'center',
    backgroundColor: '#0f131c',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 28,
    paddingBottom: 40,
  },

  // Atmospheric Glows
  ambientGlowTop: {
    position: 'absolute',
    top: -60,
    left: '20%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  ambientGlowRight: {
    position: 'absolute',
    top: '40%',
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },

  // Top Utility
  topUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vipLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 32, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.15)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4edea3',
    marginRight: 6,
  },
  vipLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 1.5,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMedallionContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoMedallionGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  logoMedallionRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMedallionCore: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#1c2028',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d8c3ad',
    letterSpacing: 2.5,
    marginTop: 4,
    textAlign: 'center',
  },

  // Role Switcher Segmented Pill
  roleSwitcherContainer: {
    width: '100%',
    marginBottom: 18,
  },
  roleSwitcherTrack: {
    width: '100%',
    height: 44,
    borderRadius: 999,
    backgroundColor: '#181c24',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 116, 0.1)',
  },
  roleSlidingIndicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '50%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  roleIndicatorGradient: {
    flex: 1,
    borderRadius: 999,
  },
  roleTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    height: '100%',
  },
  roleTabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  roleTabTextActive: {
    color: '#472a00',
    fontWeight: '700',
  },
  roleTabTextInactive: {
    color: '#d8c3ad',
    fontWeight: '500',
  },

  // Main Card
  loginCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  modeTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#262a33',
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  modeTabActive: {},
  modeTabText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  activeTabLine: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 2.5,
    borderRadius: 2,
  },
  roleHintText: {
    fontSize: 12,
    color: '#d8c3ad',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Form Fields
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d8c3ad',
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0a0e16',
    borderWidth: 1,
    borderColor: '#31353e',
    paddingHorizontal: 12,
  },
  inputFieldError: {
    borderColor: '#ffb4ab',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#dfe2ee',
    fontSize: 14,
    height: '100%',
  },
  eyeIconBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#ffb4ab',
    paddingLeft: 4,
    marginTop: 2,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rememberMeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#0a0e16',
    borderWidth: 1,
    borderColor: '#31353e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxActive: {
    backgroundColor: '#ffc174',
    borderColor: '#ffc174',
  },
  rememberMeText: {
    fontSize: 12,
    color: '#d8c3ad',
  },
  forgotKeyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffc174',
  },

  // Primary CTA Button
  ctaButtonWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaButtonGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#472a00',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#262a33',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 1.5,
  },

  // Social Auth Pills
  socialAuthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  socialPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#181c24',
    borderWidth: 1,
    borderColor: '#262a33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dfe2ee',
  },

  // One-Touch VIP Fast-Pass Demo
  fastPassSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#262a33',
  },
  fastPassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  fastPassTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d8c3ad',
    letterSpacing: 1.2,
  },
  fastPassRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fastPassCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#181c24',
    borderWidth: 1,
    borderColor: '#262a33',
  },
  fastPassCardActive: {
    borderColor: '#ffc174',
    backgroundColor: 'rgba(255, 193, 116, 0.08)',
  },
  passBadgeGreen: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    marginBottom: 4,
  },
  passBadgeGreenText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4edea3',
    letterSpacing: 1,
  },
  passBadgeGold: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: 4,
  },
  passBadgeGoldText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffc174',
    letterSpacing: 1,
  },
  passCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dfe2ee',
  },
  passCardRole: {
    fontSize: 10,
    color: '#a08e7a',
    marginTop: 2,
  },

  // Footer Charter
  footerCharter: {
    marginTop: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  footerCharterText: {
    fontSize: 11,
    color: 'rgba(216, 195, 173, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
