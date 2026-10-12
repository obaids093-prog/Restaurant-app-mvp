/**
 * src/components/ui/PhoneInput.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Pakistani Mobile Number Input
 * 
 * A premium phone input component styled like Careem/JazzCash/Easypaisa.
 * Shows a fixed "+92" country badge on the left. The user only types
 * the 10-digit local part (3XX-XXXXXXX) and the component auto-formats
 * with a dash after the operator prefix (3 digits → "3XX-").
 *
 * Props:
 *   value       — raw digits (no country code, no dashes), e.g. "3001234567"
 *   onChangeText(rawDigits) — called with clean digits only
 *   label, error, editable, style — pass-through to wrapper
 *
 * The parent stores ONLY raw digits. Formatting is purely visual.
 * ═══════════════════════════════════════════════════════════
 */
import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// Format raw digits → display string  "3001234567" → "300-1234567"
const formatPakPhone = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 10); // max 10 digits
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
};

// Strip everything except digits
const stripToDigits = (text) => text.replace(/\D/g, '').slice(0, 10);

export default function PhoneInput({
  value = '',
  onChangeText,
  label = 'Mobile Number',
  error,
  editable = true,
  style,
  placeholder = '3XX-XXXXXXX',
}) {
  const { colors, typography, radius, fonts } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = formatPakPhone(value);

  const handleTextChange = useCallback(
    (text) => {
      const raw = stripToDigits(text);
      onChangeText?.(raw);
    },
    [onChangeText]
  );

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          style={[
            typography.caption,
            styles.label,
            { color: colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderRadius: radius.input,
            borderColor: error
              ? colors.error
              : isFocused
              ? colors.inputFocusBorder
              : colors.inputBorder,
          },
        ]}
      >
        {/* Country Code Badge */}
        <View style={[styles.countryBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.subtleBorder }]}>
          <Text style={[styles.flagText]}>🇵🇰</Text>
          <Text style={[styles.codeText, { color: colors.textPrimary, fontFamily: fonts.semiBold }]}>
            +92
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.inputBorder }]} />

        {/* Icon */}
        <View style={styles.phoneIcon}>
          <Ionicons name="call-outline" size={17} color={colors.primary} />
        </View>

        {/* Text Input */}
        <TextInput
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          maxLength={12} // "300-1234567" = 11 chars + 1 buffer
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || 'Mobile Number'}
          style={[
            typography.body,
            styles.textInput,
            {
              color: colors.textPrimary,
              fontFamily: fonts.medium,
              letterSpacing: 1,
            },
          ]}
        />
      </View>

      {/* Hint text */}
      {!error ? (
        <Text style={[styles.hint, { color: colors.mutedText, fontFamily: fonts.regular }]}>
          Pakistani mobile number (e.g. 0300-1234567)
        </Text>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.error, fontWeight: '500' },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    minHeight: 52,
    paddingRight: 14,
    overflow: 'hidden',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRightWidth: 0, // divider handles this
  },
  flagText: {
    fontSize: 16,
  },
  codeText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1.2,
    alignSelf: 'stretch',
    marginVertical: 10,
  },
  phoneIcon: {
    marginLeft: 10,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    marginRight: 4,
  },
});
