import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, PhoneInput, Button } from '../../components/ui';
import brand from '../../config/brand';
import { styles } from './loginStyles';

export default function EmailPasswordForm({
  mode,
  values,
  errors,
  handleChange,
  rememberEmail,
  setRememberEmail,
  isSubmitting,
  isAuthSuccess,
  onSubmitEmailForm,
  setAuthMethod,
  setServerError,
  setPhoneError,
  colors,
  fonts,
  radius,
}) {
  const isMinLength = (values.password || '').length >= 8;
  const hasDigit = /\d/.test(values.password || '');
  const isMatching =
    (values.confirmPassword || '').length > 0 && values.password === values.confirmPassword;

  return (
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

      {/* Primary Submit Button */}
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
  );
}
