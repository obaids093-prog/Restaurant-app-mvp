import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  rightAction,
  style,
  inputStyle,
  editable = true,
  maxLength,
  accessibilityLabel,
}) {
  const { colors, typography, radius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;
  const isInputSecure = isPassword && !isPasswordVisible;

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
          multiline && { minHeight: 88, alignItems: 'flex-start' },
        ]}
      >
        {icon ? <View style={styles.leftIcon}>{icon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isInputSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          style={[
            typography.body,
            styles.textInput,
            { color: colors.textPrimary },
            multiline && { textAlignVertical: 'top', paddingTop: 10 },
            inputStyle,
          ]}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightAction}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.mutedText}
            />
          </TouchableOpacity>
        ) : rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : null}
      </View>

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
    minHeight: 50,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightAction: {
    marginLeft: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
